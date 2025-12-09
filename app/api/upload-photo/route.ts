import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processForCatalog, processOriginal } from '@/lib/watermark';

//Crear cliente de Supabase con permisos de servicio para upload
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const galleryId = formData.get('galleryId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!galleryId) {
      return NextResponse.json({ error: 'No gallery ID provided' }, { status: 400 });
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generar nombres únicos
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const baseFileName = `${timestamp}-${randomString}`;

    // Procesar imágenes
    console.log('Procesando imagen original...');
    const originalBuffer = await processOriginal(buffer);

    console.log('Procesando imagen con marca de agua...');
    const watermarkedBuffer = await processForCatalog(buffer);

    // Rutas de almacenamiento
    const originalPath = `galleries/${galleryId}/original/${baseFileName}.${fileExtension}`;
    const watermarkedPath = `galleries/${galleryId}/watermarked/${baseFileName}.${fileExtension}`;

    // Subir versión original (privada)
    console.log('Subiendo versión original...');
    const { data: originalData, error: originalError } = await supabase.storage
      .from('gallery-images')
      .upload(originalPath, originalBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (originalError) {
      console.error('Error uploading original:', originalError);
      throw originalError;
    }

    // Subir versión con marca de agua (pública)
    console.log('Subiendo versión con marca de agua...');
    const { data: watermarkedData, error: watermarkedError } = await supabase.storage
      .from('gallery-images')
      .upload(watermarkedPath, watermarkedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (watermarkedError) {
      console.error('Error uploading watermarked:', watermarkedError);
      // Limpiar archivo original si falla el watermarked
      await supabase.storage.from('gallery-images').remove([originalPath]);
      throw watermarkedError;
    }

    // Obtener URL pública de la versión con marca de agua
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(watermarkedPath);

    if (!urlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública');
    }

    // Guardar en la base de datos
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          gallery_id: galleryId,
          storage_path: watermarkedPath, // Catálogo usa versión con marca de agua
          original_path: originalPath, // Guardar ruta a original
          public_url: urlData.publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error saving to database:', dbError);
      // Limpiar archivos si falla el guardado en BD
      await supabase.storage.from('gallery-images').remove([originalPath, watermarkedPath]);
      throw dbError;
    }

    console.log('Foto subida exitosamente:', photoData);

    return NextResponse.json({
      success: true,
      photo: photoData,
      originalPath,
      watermarkedPath,
      publicUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('Error in upload-photo API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al procesar la foto',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// Configuración para permitir archivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
};

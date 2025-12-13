import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { processForCatalog, processOriginal } from '@/lib/watermark';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para procesar imágenes

/**
 * Endpoint para subir fotos con marca de agua
 * POST /api/upload-photo
 *
 * Proceso:
 * 1. Recibe imagen del cliente
 * 2. Procesa versión original (alta calidad, sin watermark)
 * 3. Procesa versión catálogo (con watermark)
 * 4. Sube ambas a Supabase Storage
 * 5. Guarda registro en BD con ambos paths
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const galleryId = formData.get('galleryId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    if (!galleryId) {
      return NextResponse.json(
        { error: 'No se proporcionó galleryId' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    console.log(`📸 Procesando imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generar nombres únicos
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const baseFileName = `${timestamp}-${randomString}`;

    // 1. Procesar versión ORIGINAL (sin watermark, alta calidad)
    console.log('🔧 Procesando versión original...');
    const originalBuffer = await processOriginal(buffer);
    const originalFileName = `${baseFileName}-original.${fileExtension}`;
    const originalPath = `galleries/${galleryId}/originals/${originalFileName}`;

    // 2. Procesar versión CATÁLOGO (con watermark)
    console.log('💧 Aplicando marca de agua...');
    const catalogBuffer = await processForCatalog(buffer);
    const catalogFileName = `${baseFileName}-catalog.jpg`; // Siempre JPG para catálogo
    const catalogPath = `galleries/${galleryId}/${catalogFileName}`;

    // 3. Subir ORIGINAL a Supabase Storage
    console.log('⬆️  Subiendo versión original...');
    const { error: originalError } = await supabase.storage
      .from('gallery-images')
      .upload(originalPath, originalBuffer, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (originalError) {
      console.error('❌ Error subiendo original:', originalError);
      throw new Error(`Error subiendo original: ${originalError.message}`);
    }

    // 4. Subir CATÁLOGO a Supabase Storage
    console.log('⬆️  Subiendo versión catálogo...');
    const { error: catalogError } = await supabase.storage
      .from('gallery-images')
      .upload(catalogPath, catalogBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (catalogError) {
      console.error('❌ Error subiendo catálogo:', catalogError);

      // Limpiar: eliminar original si el catálogo falló
      await supabase.storage.from('gallery-images').remove([originalPath]);

      throw new Error(`Error subiendo catálogo: ${catalogError.message}`);
    }

    // 5. Obtener URL pública (solo del catálogo con watermark)
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(catalogPath);

    if (!urlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública');
    }

    // 6. Guardar en la base de datos
    console.log('💾 Guardando en base de datos...');
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          gallery_id: galleryId,
          storage_path: catalogPath,      // Foto CON watermark (galería pública)
          original_path: originalPath,     // Foto SIN watermark (post-compra)
          public_url: urlData.publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error guardando en BD:', dbError);

      // Limpiar: eliminar ambos archivos si falló la BD
      await supabase.storage.from('gallery-images').remove([originalPath, catalogPath]);

      throw new Error(`Error guardando en BD: ${dbError.message}`);
    }

    console.log('✅ Foto procesada exitosamente:', photoData.id);

    return NextResponse.json({
      success: true,
      photo: photoData,
    });

  } catch (error: any) {
    console.error('❌ Error en upload-photo:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error procesando la foto',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

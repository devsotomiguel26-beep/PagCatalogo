import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processForCatalog, processOriginal } from '@/lib/watermark';

// Crear cliente Supabase con permisos de admin para server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const runtime = 'nodejs';
// maxDuration limitado a 10s en Vercel Hobby plan
// Si tienes Vercel Pro, puedes aumentar a 60

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
  console.log('🚀 Inicio de upload-photo endpoint');

  try {
    // Verificar que las credenciales de Supabase estén configuradas
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const galleryId = formData.get('galleryId') as string;

    console.log(`📋 FormData recibido - File: ${file?.name}, GalleryId: ${galleryId}`);

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
    console.log('✅ Buffer creado exitosamente');

    // Generar nombres únicos
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const baseFileName = `${timestamp}-${randomString}`;

    // 1. Procesar versión ORIGINAL (sin watermark, alta calidad)
    console.log('🔧 Procesando versión original...');
    let originalBuffer;
    try {
      originalBuffer = await processOriginal(buffer);
      console.log('✅ Versión original procesada');
    } catch (error: any) {
      console.error('❌ Error procesando original:', error);
      return NextResponse.json(
        {
          error: 'Error procesando imagen original',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const originalFileName = `${baseFileName}-original.${fileExtension}`;
    const originalPath = `galleries/${galleryId}/originals/${originalFileName}`;

    // 2. Procesar versión CATÁLOGO (con watermark)
    console.log('💧 Aplicando marca de agua...');
    let catalogBuffer;
    try {
      catalogBuffer = await processForCatalog(buffer);
      console.log('✅ Marca de agua aplicada');
    } catch (error: any) {
      console.error('❌ Error aplicando watermark:', error);
      return NextResponse.json(
        {
          error: 'Error aplicando marca de agua',
          details: error.message,
        },
        { status: 500 }
      );
    }

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

    // Intentar primero con original_path (si existe la columna)
    let photoData;
    let dbError;

    const insertData: any = {
      gallery_id: galleryId,
      storage_path: catalogPath,
      public_url: urlData.publicUrl,
    };

    // Intentar agregar original_path solo si la columna existe
    try {
      const result = await supabase
        .from('photos')
        .insert([
          {
            ...insertData,
            original_path: originalPath,
          },
        ])
        .select()
        .single();

      photoData = result.data;
      dbError = result.error;
    } catch (error: any) {
      // Si falla (probablemente porque original_path no existe), intentar sin ella
      console.warn('⚠️  Columna original_path no existe, insertando sin ella...');
      const result = await supabase
        .from('photos')
        .insert([insertData])
        .select()
        .single();

      photoData = result.data;
      dbError = result.error;
    }

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

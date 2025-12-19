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

    // Leer JSON body
    const body = await request.json();
    const { originalPath, galleryId, fileName } = body;

    console.log(`📋 Procesando - OriginalPath: ${originalPath}, GalleryId: ${galleryId}`);

    if (!originalPath || !galleryId || !fileName) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Consultar galería para obtener configuración de watermark
    // (con manejo robusto si la columna watermark_path aún no existe)
    console.log('🔍 Consultando configuración de marca de agua de la galería...');
    let watermarkPathToUse: string | undefined;

    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('watermark_path')
        .eq('id', galleryId)
        .single();

      if (galleryError) {
        // Si el error es por columna no encontrada, simplemente usar fallback
        if (galleryError.message.includes('column') || galleryError.code === 'PGRST116') {
          console.log('⚠️  Columna watermark_path no existe aún, usando marca global/local');
        } else {
          console.error('❌ Error consultando galería:', galleryError);
          // Para otros errores, continuar con fallback en lugar de fallar
        }
      } else if (galleryData?.watermark_path) {
        // Usar marca de agua personalizada de la galería
        console.log(`🎨 Marca de agua personalizada configurada: ${galleryData.watermark_path}`);

        const { data: watermarkUrl } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(galleryData.watermark_path);

        watermarkPathToUse = watermarkUrl.publicUrl;
        console.log(`✅ Usando marca de agua personalizada`);
      }
    } catch (error) {
      console.log('⚠️  Error al consultar watermark personalizada, usando fallback:', error);
    }

    // Si no hay marca personalizada, intentar marca global
    if (!watermarkPathToUse) {
      console.log('🌐 Verificando marca de agua global en Supabase...');

      const globalWatermarkPath = 'watermarks/global/logo.png';
      const { data: globalExists } = await supabase.storage
        .from('gallery-images')
        .list('watermarks/global', {
          search: 'logo.png',
        });

      if (globalExists && globalExists.length > 0) {
        const { data: globalUrl } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(globalWatermarkPath);

        watermarkPathToUse = globalUrl.publicUrl;
        console.log('✅ Usando marca de agua global desde Supabase');
      } else {
        // Fallback a marca de agua local en /public
        console.log('📁 Usando marca de agua local (fallback)');
        watermarkPathToUse = undefined; // Usará el path por defecto en watermark.ts
      }
    }

    console.log(`📥 Descargando original desde Supabase: ${originalPath}`);

    // 1. Descargar foto original de Supabase Storage
    const { data: originalFile, error: downloadError } = await supabase.storage
      .from('gallery-images')
      .download(originalPath);

    if (downloadError || !originalFile) {
      console.error('❌ Error descargando original:', downloadError);
      return NextResponse.json(
        { error: 'Error descargando foto original', details: downloadError?.message },
        { status: 500 }
      );
    }

    console.log(`✅ Original descargado (${(originalFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // Convertir Blob a Buffer
    const arrayBuffer = await originalFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ Buffer creado exitosamente');

    // Generar path para catálogo (el original ya está subido)
    const baseFileName = fileName.split('.')[0]; // Quitar extensión
    const catalogFileName = `${baseFileName}-catalog.jpg`; // Siempre JPG para catálogo
    const catalogPath = `galleries/${galleryId}/${catalogFileName}`;

    // 2. Procesar versión CATÁLOGO (con watermark)
    console.log('💧 Aplicando marca de agua...');
    let catalogBuffer;
    try {
      catalogBuffer = await processForCatalog(buffer, watermarkPathToUse);
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

    // 3. Subir CATÁLOGO a Supabase Storage
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
      throw new Error(`Error subiendo catálogo: ${catalogError.message}`);
    }

    // 4. Obtener URL pública (solo del catálogo con watermark)
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(catalogPath);

    if (!urlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública');
    }

    // 5. Guardar en la base de datos
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Crear cliente Supabase con permisos de admin para server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { galleryId, photoId } = body;

    // Validar parámetros
    if (!galleryId || !photoId) {
      return NextResponse.json(
        { error: 'galleryId y photoId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la foto existe y obtener el original_path
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, gallery_id, original_path')
      .eq('id', photoId)
      .eq('gallery_id', galleryId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'La foto no existe o no pertenece a esta galería' },
        { status: 404 }
      );
    }

    // Descargar la foto ORIGINAL (sin watermark) desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('gallery-images')
      .download(photo.original_path);

    if (downloadError || !fileData) {
      console.error('Error downloading original photo:', downloadError);
      return NextResponse.json(
        { error: 'Error al descargar la foto original' },
        { status: 500 }
      );
    }

    // Convertir Blob a Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Procesar la imagen con Sharp: crear thumbnail 400x400px SIN watermark
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Subir el thumbnail a Supabase Storage
    const thumbnailPath = `galleries/${galleryId}/cover-thumbnail.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true, // Sobrescribir si ya existe
      });

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el thumbnail' },
        { status: 500 }
      );
    }

    // Obtener la URL pública del thumbnail
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(thumbnailPath);

    const coverThumbnailUrl = urlData.publicUrl;

    // Actualizar la galería con cover_photo_id y cover_thumbnail_url
    const { error: updateError } = await supabase
      .from('galleries')
      .update({
        cover_photo_id: photoId,
        cover_thumbnail_url: coverThumbnailUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', galleryId);

    if (updateError) {
      console.error('Error updating gallery:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la galería' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portada actualizada correctamente',
      coverPhotoId: photoId,
      coverThumbnailUrl,
    });
  } catch (error: any) {
    console.error('Error in set-cover-photo API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

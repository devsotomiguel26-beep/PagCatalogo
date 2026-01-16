import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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

    // Verificar que la foto existe y pertenece a la galería
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, gallery_id')
      .eq('id', photoId)
      .eq('gallery_id', galleryId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'La foto no existe o no pertenece a esta galería' },
        { status: 404 }
      );
    }

    // Actualizar el cover_photo_id de la galería
    const { error: updateError } = await supabase
      .from('galleries')
      .update({
        cover_photo_id: photoId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', galleryId);

    if (updateError) {
      console.error('Error updating cover_photo_id:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la portada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portada actualizada correctamente',
      coverPhotoId: photoId,
    });
  } catch (error: any) {
    console.error('Error in set-cover-photo API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

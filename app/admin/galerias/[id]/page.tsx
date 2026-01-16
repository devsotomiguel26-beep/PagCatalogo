'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GalleryForm from '@/components/forms/GalleryForm';
import PhotoUploadArea from '@/components/upload/PhotoUploadArea';
import CoverPhotoSelector from '@/components/admin/CoverPhotoSelector';
import Link from 'next/link';
import Image from 'next/image';

interface GalleryFormData {
  title: string;
  slug: string;
  category_id: string;
  event_type: string;
  tournament: string;
  event_date: string;
  location: string;
  status: string;
  watermark_path?: string | null;
  cover_photo_id?: string | null;
  cover_thumbnail_url?: string | null;
}

interface Photo {
  id: string;
  public_url: string;
  storage_path: string;
  position?: number;
}

export default function EditGaleriaPage() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<GalleryFormData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (galleryId) {
      fetchGallery();
      fetchPhotos();
    }
  }, [galleryId]);

  async function fetchGallery() {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', galleryId)
      .single();

    if (error || !data) {
      console.error('Error fetching gallery:', error);
      router.push('/admin/galerias');
      return;
    }

    setGallery(data);
    setLoading(false);
  }

  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('position', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setPhotos(data);
    }
  }

  async function handleSubmit(data: GalleryFormData, watermarkFile?: File | null) {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Si cambió el slug, verificar que sea único
      if (data.slug !== gallery?.slug) {
        const { data: existing, error: checkError } = await supabase
          .from('galleries')
          .select('id')
          .eq('slug', data.slug)
          .neq('id', galleryId)
          .maybeSingle();

        if (checkError) {
          throw new Error('Error al verificar el slug');
        }

        if (existing) {
          setError('Ya existe otra galería con ese slug. Por favor, usa uno diferente.');
          setIsSubmitting(false);
          return;
        }
      }

      // Si hay un archivo de watermark, subirlo a Supabase
      let watermarkPathToSave = data.watermark_path;

      if (watermarkFile) {
        const watermarkPath = `watermarks/custom/${galleryId}-watermark.png`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(watermarkPath, watermarkFile, {
            cacheControl: '3600',
            upsert: true, // Permitir sobrescribir
          });

        if (uploadError) {
          throw new Error(`Error subiendo marca de agua: ${uploadError.message}`);
        }

        watermarkPathToSave = watermarkPath;
      }

      // Actualizar la galería
      const { error: updateError } = await supabase
        .from('galleries')
        .update({
          title: data.title,
          slug: data.slug,
          category_id: data.category_id,
          event_type: data.event_type,
          tournament: data.tournament || null,
          event_date: data.event_date,
          location: data.location || null,
          status: data.status,
          watermark_path: watermarkPathToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', galleryId);

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage('Galería actualizada correctamente');
      setGallery({ ...data, watermark_path: watermarkPathToSave });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating gallery:', err);
      setError(err.message || 'Error al actualizar la galería. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deletePhoto(photoId: string, storagePath: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta foto?')) {
      return;
    }

    try {
      // Eliminar de storage
      const { error: storageError } = await supabase.storage
        .from('gallery-images')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        throw dbError;
      }

      // Actualizar estado local
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Error al eliminar la foto');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!gallery) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/admin/dashboard" className="hover:text-red-600">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/admin/galerias" className="hover:text-red-600">
              Galerías
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{gallery.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Galería</h1>
          <p className="mt-2 text-gray-600">
            Modifica los datos de la galería y gestiona las fotos
          </p>
        </div>
        <Link
          href={`/galerias/${gallery.slug}`}
          target="_blank"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="mr-2 -ml-1 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Ver en sitio público
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Información de la galería
        </h2>
        <GalleryForm
          initialData={gallery}
          onSubmit={handleSubmit}
          submitLabel="Guardar Cambios"
          isSubmitting={isSubmitting}
          galleryId={galleryId}
        />
      </div>

      {/* Upload Photos Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Subir Fotos</h2>
        <PhotoUploadArea galleryId={galleryId} onUploadComplete={fetchPhotos} />
      </div>

      {/* Photos Gallery Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Fotos de la Galería
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} en esta galería
            </p>
          </div>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={photo.public_url}
                    alt="Foto"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <button
                  onClick={() => deletePhoto(photo.id, photo.storage_path)}
                  className="absolute top-2 right-2 p-2 bg-devil-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-devil-700"
                  aria-label="Eliminar foto"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay fotos en esta galería
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Usa el área de subida superior para agregar las primeras fotos
            </p>
          </div>
        )}
      </div>

      {/* Cover Photo Selector Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Foto de Portada
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Selecciona qué foto aparecerá como miniatura de esta galería
          </p>
        </div>

        <CoverPhotoSelector
          photos={photos}
          currentCoverPhotoId={gallery.cover_photo_id}
          galleryId={galleryId}
          onCoverPhotoSet={fetchGallery}
        />
      </div>
    </div>
  );
}

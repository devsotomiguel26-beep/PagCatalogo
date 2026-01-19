'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GalleryForm from '@/components/forms/GalleryForm';
import Link from 'next/link';

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
  photographer_id?: string | null;
}

export default function NuevaGaleriaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(data: GalleryFormData, watermarkFile?: File | null) {
    setIsSubmitting(true);
    setError('');

    try {
      // Verificar que el slug sea único
      const { data: existing, error: checkError } = await supabase
        .from('galleries')
        .select('id')
        .eq('slug', data.slug)
        .maybeSingle();

      if (checkError) {
        throw new Error('Error al verificar el slug');
      }

      if (existing) {
        setError('Ya existe una galería con ese slug. Por favor, usa uno diferente.');
        setIsSubmitting(false);
        return;
      }

      // Crear la galería
      const { data: newGallery, error: insertError } = await supabase
        .from('galleries')
        .insert([
          {
            title: data.title,
            slug: data.slug,
            category_id: data.category_id,
            event_type: data.event_type,
            tournament: data.tournament || null,
            event_date: data.event_date,
            location: data.location || null,
            status: data.status,
            photographer_id: data.photographer_id || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Si hay un archivo de watermark, subirlo a Supabase
      if (watermarkFile && newGallery) {
        const watermarkPath = `watermarks/custom/${newGallery.id}-watermark.png`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(watermarkPath, watermarkFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error subiendo marca de agua:', uploadError);
          // No fallar la creación de la galería si falla el watermark
          // El usuario puede subirlo después en la edición
        } else {
          // Actualizar la galería con el watermark_path
          await supabase
            .from('galleries')
            .update({ watermark_path: watermarkPath })
            .eq('id', newGallery.id);
        }
      }

      // Redirigir a la página de edición para subir fotos
      router.push(`/admin/galerias/${newGallery.id}`);
    } catch (err: any) {
      console.error('Error creating gallery:', err);
      setError(err.message || 'Error al crear la galería. Por favor, intenta nuevamente.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <li className="text-gray-900 font-medium">Nueva galería</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Galería</h1>
        <p className="mt-2 text-gray-600">
          Completa la información básica de la galería. Después podrás subir las fotos.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <GalleryForm
          onSubmit={handleSubmit}
          submitLabel="Crear Galería"
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Consejos para crear una galería
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>El slug se genera automáticamente desde el título, pero puedes editarlo</li>
                <li>Puedes crear la galería como "Borrador" y publicarla más tarde</li>
                <li>Después de crear la galería, podrás subir las fotos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

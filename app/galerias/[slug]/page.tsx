'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PhotoGrid from '@/components/PhotoGrid';
import Lightbox from '@/components/Lightbox';
import PhotoGridSkeleton from '@/components/skeletons/PhotoGridSkeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import FloatingCartButton from '@/components/FloatingCartButton';
import RequestPhotosModal from '@/components/RequestPhotosModal';
import Toast from '@/components/Toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Photo {
  id: string;
  public_url: string;
  storage_path: string;
  position?: number;
}

interface Gallery {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  event_type: string;
  tournament?: string;
  event_date: string;
  location?: string;
  categories: Category;
}

export default function GaleriaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (slug) {
      fetchGallery();
    }
  }, [slug]);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    if (gallery) {
      const storageKey = `favorites_${gallery.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const favArray = JSON.parse(stored);
          setFavorites(new Set(favArray));
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      }
    }
  }, [gallery]);

  // Guardar favoritos en localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    if (gallery) {
      const storageKey = `favorites_${gallery.id}`;
      localStorage.setItem(storageKey, JSON.stringify([...newFavorites]));
      setFavorites(newFavorites);
    }
  };

  async function fetchGallery() {
    setLoading(true);

    // Obtener galería
    const { data: galleryData, error: galleryError } = await supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        category_id,
        event_type,
        tournament,
        event_date,
        location,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (galleryError || !galleryData) {
      console.error('Error fetching gallery:', galleryError);
      router.push('/galerias');
      return;
    }

    setGallery(galleryData as Gallery);

    // Obtener fotos
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryData.id)
      .order('position', { ascending: true, nullsFirst: false });

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    } else {
      setPhotos(photosData || []);
    }

    setLoading(false);
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));
  };

  const toggleFavorite = (photoId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(photoId)) {
      newFavorites.delete(photoId);
    } else {
      newFavorites.add(photoId);
    }
    saveFavorites(newFavorites);
  };

  const handleRequestSubmit = async (data: {
    parentName: string;
    email: string;
    phone: string;
    childName: string;
  }) => {
    if (!gallery) return;

    try {
      const photoIds = Array.from(favorites);

      const { data: insertedData, error } = await supabase
        .from('photo_requests')
        .insert([
          {
            gallery_id: gallery.id,
            photo_ids: photoIds,
            client_name: data.parentName,
            client_email: data.email,
            client_phone: data.phone,
            child_name: data.childName,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Enviar emails de confirmación
      try {
        await fetch('/api/send-request-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: data.parentName,
            clientEmail: data.email,
            clientPhone: data.phone,
            childName: data.childName,
            galleryTitle: gallery.title,
            photoCount: photoIds.length,
            requestId: insertedData.id,
          }),
        });
      } catch (emailError) {
        // No fallar si el email no se envía, solo log
        console.error('Error sending confirmation emails:', emailError);
      }

      // Mostrar toast de éxito
      setToast({
        message: '¡Solicitud enviada! Recibirás un email de confirmación pronto.',
        type: 'success',
      });

      // Limpiar favoritos después de enviar
      setFavorites(new Set());
      if (gallery) {
        localStorage.removeItem(`favorites_${gallery.id}`);
      }

      // Cerrar modal
      setRequestModalOpen(false);
    } catch (error: any) {
      console.error('Error submitting request:', error);
      throw new Error(error.message || 'Error al enviar la solicitud');
    }
  };

  const formattedDate = gallery
    ? new Date(gallery.event_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">
          <section className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="flex gap-3">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </section>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <PhotoGridSkeleton count={12} />
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!gallery) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow">
        {/* Hero/Header de la galería */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="mb-4">
              <ol className="flex items-center space-x-2 text-sm text-gray-600">
                <li>
                  <a href="/" className="hover:text-red-600">
                    Inicio
                  </a>
                </li>
                <li>/</li>
                <li>
                  <a href="/galerias" className="hover:text-red-600">
                    Galerías
                  </a>
                </li>
                <li>/</li>
                <li className="text-gray-900 font-medium">{gallery.title}</li>
              </ol>
            </nav>

            {/* Título y metadatos */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {gallery.title}
            </h1>

            <div className="flex flex-wrap gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {gallery.categories.name}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                {gallery.event_type}
              </span>
            </div>

            <div className="space-y-2 text-gray-700">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formattedDate}
              </div>

              {gallery.tournament && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  {gallery.tournament}
                </div>
              )}

              {gallery.location && (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {gallery.location}
                </div>
              )}
            </div>

            {/* Contador de favoritas */}
            {favorites.size > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg inline-block">
                <div className="flex items-center text-red-800">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="font-medium">
                    {favorites.size} {favorites.size === 1 ? 'foto marcada' : 'fotos marcadas'} como
                    favorita{favorites.size !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Grid de fotos */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {photos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
              </h2>
            </div>
          )}

          <PhotoGrid
            photos={photos}
            onPhotoClick={openLightbox}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      </main>

      <Footer />

      {/* Botón flotante de solicitud */}
      <FloatingCartButton
        count={favorites.size}
        onClick={() => setRequestModalOpen(true)}
      />

      {/* Modal de solicitud */}
      <RequestPhotosModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        photos={photos.filter((p) => favorites.has(p.id))}
        galleryTitle={gallery?.title || ''}
        galleryId={gallery?.id || ''}
        onSubmit={handleRequestSubmit}
      />

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          photos={photos}
          currentIndex={currentPhotoIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

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

      // 1. Crear solicitud en la base de datos
      const { data: insertedData, error } = await supabase
        .from('photo_requests')
        .insert([
          {
            gallery_id: gallery.id,
            gallery_title: gallery.title,
            gallery_event_date: gallery.event_date,
            gallery_event_type: gallery.event_type,
            gallery_slug: gallery.slug,
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

      // 2. Enviar emails de confirmación
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
        console.error('Error sending confirmation emails:', emailError);
      }

      // 3. Crear pago en Flow
      const paymentResponse = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: insertedData.id,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Error al crear el pago');
      }

      const paymentData = await paymentResponse.json();

      // 4. Limpiar favoritos antes de redirigir
      setFavorites(new Set());
      if (gallery) {
        localStorage.removeItem(`favorites_${gallery.id}`);
      }

      // 5. Redirigir a Flow para el pago
      window.location.href = paymentData.paymentUrl;
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
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow">
          <section className="border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-8 lg:px-12 py-12 lg:py-16">
              <div className="animate-pulse space-y-6">
                <div className="h-10 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
            </div>
          </section>
          <section className="max-w-6xl mx-auto px-8 lg:px-12 py-12 lg:py-16">
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        {/* Hero/Header minimalista */}
        <section className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-8 lg:px-12 py-12 lg:py-16">
            {/* Breadcrumb minimalista */}
            <nav className="mb-8">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li>
                  <a href="/" className="hover:text-devil-600 transition-colors">
                    Inicio
                  </a>
                </li>
                <li>·</li>
                <li>
                  <a href="/galerias" className="hover:text-devil-600 transition-colors">
                    Galerías
                  </a>
                </li>
                <li>·</li>
                <li className="text-gray-900">{gallery.title}</li>
              </ol>
            </nav>

            {/* Título - tipografía light */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              {gallery.title}
            </h1>

            {/* Metadata en una línea - minimalista */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
              <span className="capitalize">{gallery.event_type}</span>
              {gallery.tournament && (
                <>
                  <span>·</span>
                  <span>{gallery.tournament}</span>
                </>
              )}
              <span>·</span>
              <span>{formattedDate}</span>
              {gallery.location && (
                <>
                  <span>·</span>
                  <span>{gallery.location}</span>
                </>
              )}
            </div>

            {/* Contador de fotos y favoritas */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
              {favorites.size > 0 && (
                <>
                  <span>·</span>
                  <span className="text-devil-600 font-medium">
                    {favorites.size} seleccionada{favorites.size !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Grid de fotos - espaciado generoso */}
        <section className="max-w-6xl mx-auto px-8 lg:px-12 py-12 lg:py-16">
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

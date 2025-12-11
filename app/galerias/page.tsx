'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GalleryCard from '@/components/GalleryCard';
import GalleryGrid from '@/components/GalleryGrid';
import GalleryCardSkeleton from '@/components/skeletons/GalleryCardSkeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Gallery {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  event_type: string;
  event_date: string;
  categories: Category;
  photos: { count: number }[];
  coverPhotoUrl?: string;
}

export default function GaleriasPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  // Tipos de eventos disponibles
  const eventTypes = [
    { value: 'all', label: 'Todos los eventos' },
    { value: 'partido', label: 'Partido' },
    { value: 'torneo', label: 'Torneo' },
    { value: 'evento', label: 'Evento especial' },
    { value: 'entrenamiento', label: 'Entrenamiento' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchGalleries();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  }

  async function fetchGalleries() {
    setLoading(true);

    let query = supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        category_id,
        event_type,
        event_date,
        categories (
          id,
          name,
          slug
        ),
        photos (count)
      `)
      .eq('status', 'published')
      .order('event_date', { ascending: false });

    // Aplicar filtro de categoría
    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    // Aplicar filtro de tipo de evento
    if (selectedEventType !== 'all') {
      query = query.eq('event_type', selectedEventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching galleries:', error);
    } else {
      // Para cada galería, obtener la primera foto como portada
      const galleriesWithCovers = await Promise.all(
        (data || []).map(async (gallery) => {
          const { data: photos } = await supabase
            .from('photos')
            .select('public_url')
            .eq('gallery_id', gallery.id)
            .order('position', { ascending: true, nullsFirst: false })
            .limit(1);

          return {
            ...gallery,
            coverPhotoUrl: photos && photos.length > 0 ? photos[0].public_url : undefined,
          };
        })
      );

      setGalleries(galleriesWithCovers as Gallery[]);
    }

    setLoading(false);
  }

  // Refetch cuando cambian los filtros
  useEffect(() => {
    fetchGalleries();
  }, [selectedCategory, selectedEventType]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        {/* Hero section - minimalista */}
        <section className="bg-white py-16 md:py-20 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-8 lg:px-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              Galerías
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl font-light leading-relaxed">
              Explora nuestras galerías de partidos, torneos y eventos deportivos
            </p>
          </div>
        </section>

        {/* Filtros - minimalista */}
        <section className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-8 lg:px-12 py-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro por categoría */}
              <div className="flex-1">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-devil-600 focus:border-devil-600 transition-all bg-white text-sm text-gray-700"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por tipo de evento */}
              <div className="flex-1">
                <select
                  id="event-filter"
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-devil-600 focus:border-devil-600 transition-all bg-white text-sm text-gray-700"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de galerías - espaciado generoso */}
        <section className="max-w-6xl mx-auto px-8 lg:px-12 py-16 lg:py-20">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-x-12 lg:gap-y-16">
              {Array.from({ length: 6 }).map((_, index) => (
                <GalleryCardSkeleton key={index} />
              ))}
            </div>
          ) : galleries.length > 0 ? (
            <>
              <div className="mb-10">
                <p className="text-sm text-gray-500">
                  {galleries.length} {galleries.length === 1 ? 'galería' : 'galerías'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-x-12 lg:gap-y-16">
                {galleries.map((gallery) => (
                  <GalleryCard
                    key={gallery.id}
                    id={gallery.id}
                    title={gallery.title}
                    slug={gallery.slug}
                    categoryName={gallery.categories.name}
                    eventType={gallery.event_type}
                    eventDate={gallery.event_date}
                    coverPhotoUrl={gallery.coverPhotoUrl}
                    photoCount={gallery.photos.length}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-32">
              <svg
                className="mx-auto h-16 w-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                No hay galerías disponibles
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                No se encontraron galerías con los filtros seleccionados
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

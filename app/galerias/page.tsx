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

  // Calcular contador de galerías por categoría
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') {
      return galleries.filter(g => selectedEventType === 'all' || g.event_type === selectedEventType).length;
    }
    return galleries.filter(g =>
      g.category_id === categoryId &&
      (selectedEventType === 'all' || g.event_type === selectedEventType)
    ).length;
  };

  // Calcular contador de galerías por tipo de evento
  const getEventTypeCount = (eventType: string) => {
    if (eventType === 'all') {
      return galleries.filter(g => selectedCategory === 'all' || g.category_id === selectedCategory).length;
    }
    return galleries.filter(g =>
      g.event_type === eventType &&
      (selectedCategory === 'all' || g.category_id === selectedCategory)
    ).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        {/* Hero section - Emocional con breadcrumbs */}
        <section className="bg-white py-12 md:py-16 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            {/* Breadcrumbs */}
            <nav className="mb-6">
              <ol className="flex items-center gap-2 text-sm text-gray-500">
                <li>
                  <a href="/" className="hover:text-devil-600 transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li className="text-gray-900 font-medium">Galerías</li>
              </ol>
            </nav>

            {/* Título emocional */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 mb-4 tracking-tight">
              Nuestros momentos en el campo
            </h1>

            {/* Subtítulo dinámico */}
            <p className="text-base md:text-lg text-gray-600 max-w-3xl font-light leading-relaxed">
              {loading ? (
                'Cargando galerías...'
              ) : (
                <>
                  Explora <span className="font-semibold text-devil-600">{galleries.length} galerías</span> de partidos, torneos y entrenamientos
                </>
              )}
            </p>
          </div>
        </section>

        {/* Filtros - Pills modernas */}
        <section className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
            {/* Filtro por categoría - Pills */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Categorías
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-devil-600 text-white shadow-lg shadow-devil-600/25'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todas ({loading ? '...' : getCategoryCount('all')})
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-devil-600 text-white shadow-lg shadow-devil-600/25'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name} ({loading ? '...' : getCategoryCount(category.id)})
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por tipo de evento - Pills */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tipo de evento
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedEventType(type.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedEventType === type.value
                        ? 'bg-devil-600 text-white shadow-lg shadow-devil-600/25'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type.label} ({loading ? '...' : getEventTypeCount(type.value)})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Grid de galerías - espaciado generoso */}
        <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <GalleryCardSkeleton key={index} />
              ))}
            </div>
          ) : galleries.length > 0 ? (
            <>
              {/* Contador de resultados - Más visible */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {galleries.length} {galleries.length === 1 ? 'galería encontrada' : 'galerías encontradas'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Ordenadas por fecha más reciente
                  </p>
                </div>
              </div>

              {/* Grid de galerías */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {galleries.map((gallery, index) => (
                  <div
                    key={gallery.id}
                    className="fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <GalleryCard
                      id={gallery.id}
                      title={gallery.title}
                      slug={gallery.slug}
                      categoryName={gallery.categories.name}
                      eventType={gallery.event_type}
                      eventDate={gallery.event_date}
                      coverPhotoUrl={gallery.coverPhotoUrl}
                      photoCount={gallery.photos.length}
                    />
                  </div>
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

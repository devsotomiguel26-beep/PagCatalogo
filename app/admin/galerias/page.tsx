'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Gallery {
  id: string;
  title: string;
  slug: string;
  status: string;
  event_date: string;
  event_type: string;
  categories: {
    name: string;
  };
  photos: { count: number }[];
}

export default function AdminGaleriasPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchGalleries();
  }, [filter]);

  async function fetchGalleries() {
    setLoading(true);

    let query = supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        status,
        event_date,
        event_type,
        categories (
          name
        ),
        photos (count)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtro
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching galleries:', error);
    } else {
      setGalleries(data as Gallery[]);
    }

    setLoading(false);
  }

  async function toggleStatus(galleryId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';

    const { error } = await supabase
      .from('galleries')
      .update({ status: newStatus })
      .eq('id', galleryId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Error al cambiar el estado de la galería');
    } else {
      // Actualizar el estado local
      setGalleries((prev) =>
        prev.map((g) => (g.id === galleryId ? { ...g, status: newStatus } : g))
      );
    }
  }

  async function deleteGallery(galleryId: string, title: string) {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la galería "${title}"?\n\n` +
          `Se eliminará:\n` +
          `• La galería\n` +
          `• Todas las fotos del storage\n` +
          `• Los registros de fotos en la base de datos\n\n` +
          `Se preservará:\n` +
          `✓ El historial de solicitudes de fotos (para reportes y estadísticas)\n\n` +
          `Esta acción NO se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      // 1. Obtener rutas de fotos para eliminar del storage
      const { data: photos } = await supabase
        .from('photos')
        .select('storage_path, original_path')
        .eq('gallery_id', galleryId);

      // 2. Eliminar fotos del storage
      if (photos && photos.length > 0) {
        const pathsToDelete = photos.flatMap((p) =>
          [p.storage_path, p.original_path].filter(Boolean)
        );

        if (pathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('gallery-images')
            .remove(pathsToDelete);

          if (storageError) {
            console.error('Error deleting from storage:', storageError);
            // No fallar si esto falla, continuar con la eliminación de BD
          }
        }
      }

      // 3. Eliminar la galería
      // Las fotos se eliminarán en cascada (ON DELETE CASCADE)
      // Las solicitudes se desvinculará automáticamente (ON DELETE SET NULL)
      // ya que la migración configuró la FK con ON DELETE SET NULL
      const { error: galleryError } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (galleryError) {
        console.error('Error deleting gallery:', galleryError);
        throw new Error('Error al eliminar la galería');
      }

      // 4. Actualizar la lista local
      setGalleries((prev) => prev.filter((g) => g.id !== galleryId));

      alert(
        'Galería eliminada correctamente.\n\n' +
          'El historial de solicitudes se ha preservado para reportes y estadísticas.'
      );
    } catch (error: any) {
      console.error('Error in deleteGallery:', error);
      alert(error.message || 'Error al eliminar la galería. Por favor, intenta nuevamente.');
    }
  }

  const filteredCount = galleries.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Galerías</h1>
          <p className="mt-2 text-gray-600">Gestiona todas las galerías de fotos</p>
        </div>
        <Link
          href="/admin/galerias/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Galería
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Mostrar:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'published'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Publicadas
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'draft'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Borradores
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : galleries.length > 0 ? (
          <>
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {filteredCount} {filteredCount === 1 ? 'galería' : 'galerías'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fotos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {galleries.map((gallery) => (
                    <tr key={gallery.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {gallery.title}
                        </div>
                        <div className="text-xs text-gray-500">{gallery.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {gallery.categories.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">
                          {gallery.event_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(gallery.event_date).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(gallery.id, gallery.status)}
                          className={`inline-flex px-2.5 py-1 text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-75 ${
                            gallery.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {gallery.status === 'published' ? 'Publicada' : 'Borrador'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gallery.photos.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <Link
                          href={`/admin/galerias/${gallery.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/galerias/${gallery.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => deleteGallery(gallery.id, gallery.title)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No hay galerías
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera galería.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/galerias/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nueva Galería
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

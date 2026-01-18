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
  categories: {
    name: string;
  } | null;
  photos: any[];
}

interface MetricsData {
  statusStats: {
    pending: { count: number; photos: number; revenue: number };
    paid: { count: number; photos: number; revenue: number };
    delivered: { count: number; photos: number; revenue: number };
    expired: { count: number; photos: number; revenue: number };
  };
  topMetrics: {
    totalRequests: number;
    totalRevenue: number;
    totalPhotos: number;
    avgOrderValue: number;
    conversionRate: number;
    deliveryRate: number;
    requestsLast7Days: number;
  };
  dailyActivity: Array<{
    date: string;
    total: number;
    pending: number;
    paid: number;
    delivered: number;
    revenue: number;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalGalleries: 0,
    publishedGalleries: 0,
    draftGalleries: 0,
    totalPhotos: 0,
  });
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentGalleries, setRecentGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    // Obtener estadísticas de galerías
    const { data: galleries, error: galleriesError } = await supabase
      .from('galleries')
      .select('id, status');

    if (!galleriesError && galleries) {
      const published = galleries.filter((g) => g.status === 'published').length;
      const draft = galleries.filter((g) => g.status === 'draft').length;

      setStats((prev) => ({
        ...prev,
        totalGalleries: galleries.length,
        publishedGalleries: published,
        draftGalleries: draft,
      }));
    }

    // Obtener total de fotos
    const { count: photosCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true });

    setStats((prev) => ({
      ...prev,
      totalPhotos: photosCount || 0,
    }));

    // Obtener métricas de solicitudes
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMetrics(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }

    // Obtener últimas galerías
    const { data: recent, error: recentError } = await supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        status,
        event_date,
        categories (
          name
        ),
        photos (count)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recent) {
      setRecentGalleries(recent as Gallery[]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido al panel de administración de Diablos Rojos Foto
        </p>
      </div>

      {/* Stats Cards - Galerías */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Galerías</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-600"
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
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Galerías
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalGalleries}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Publicadas
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.publishedGalleries}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Borradores
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.draftGalleries}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-purple-600"
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
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Fotos
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalPhotos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.alerts.map((alert, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border-l-4 ${
                  alert.type === 'error'
                    ? 'bg-red-50 border-red-500'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">
                      {alert.type === 'error'
                        ? '🚨'
                        : alert.type === 'warning'
                        ? '⚠️'
                        : 'ℹ️'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas de Negocio */}
      {metrics && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Métricas de Solicitudes de Fotos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Solicitudes
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {metrics.topMetrics.totalRequests}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      {metrics.topMetrics.requestsLast7Days} últimos 7 días
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ingresos Totales
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      ${metrics.topMetrics.totalRevenue.toLocaleString('es-CL')}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      Promedio: ${Math.round(metrics.topMetrics.avgOrderValue).toLocaleString('es-CL')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasa de Conversión
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {metrics.topMetrics.conversionRate.toFixed(1)}%
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      Pendiente → Pagado
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-cyan-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasa de Entrega
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {metrics.topMetrics.deliveryRate.toFixed(1)}%
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      Pagado → Entregado
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por Estado */}
      {metrics && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Distribución por Estado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-yellow-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {metrics.statusStats.pending.count}
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    {metrics.statusStats.pending.photos} fotos
                  </p>
                </div>
                <span className="text-3xl">⏳</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-green-900">Pagados</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {metrics.statusStats.paid.count}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    ${metrics.statusStats.paid.revenue.toLocaleString('es-CL')}
                  </p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-900">Entregados</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {metrics.statusStats.delivered.count}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    ${metrics.statusStats.delivered.revenue.toLocaleString('es-CL')}
                  </p>
                </div>
                <span className="text-3xl">📧</span>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-900">Enlaces Expirados</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {metrics.statusStats.expired.count}
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Requieren reenvío
                  </p>
                </div>
                <span className="text-3xl">⏰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-4">
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
            Crear Nueva Galería
          </Link>
          <Link
            href="/admin/galerias"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Ver Todas las Galerías
          </Link>
        </div>
      </div>

      {/* Recent Galleries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Galerías Recientes
          </h2>
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
              {recentGalleries.length > 0 ? (
                recentGalleries.map((gallery) => (
                  <tr key={gallery.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {gallery.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {gallery.categories?.name || 'Sin categoría'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(gallery.event_date).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                          gallery.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {gallery.status === 'published' ? 'Publicada' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gallery.photos.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/galerias/${gallery.id}`}
                        className="text-red-600 hover:text-red-900 mr-4"
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay galerías creadas aún.{' '}
                    <Link
                      href="/admin/galerias/nueva"
                      className="text-red-600 hover:text-red-900"
                    >
                      Crear la primera galería
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

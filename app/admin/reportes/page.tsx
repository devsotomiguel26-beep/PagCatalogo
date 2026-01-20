'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Photographer {
  id: string;
  name: string;
  email: string | null;
}

interface ReportItem {
  id: string;
  payment_date: string;
  created_at: string;
  client_name: string;
  client_email: string;
  gallery_title: string;
  gallery_slug: string;
  photographer_id: string;
  photographer_name: string;
  photographer_email: string | null;
  photo_count: number;
  price_per_photo: number;
  gross_amount: number;
  gateway_fee: number;
  gateway_fee_pct: number;
  net_amount: number;
  photographer_share: number;
  photographer_pct: number;
  director_share: number;
  director_pct: number;
  settlement_status: string;
  flow_order: number | null;
  status: string;
  sum_check: boolean;
  pct_check: boolean;
  gross_check: boolean;
  all_checks_pass: boolean;
  has_transaction_details: boolean;
}

interface ReportTotals {
  total_requests: number;
  total_photos: number;
  total_gross: number;
  total_gateway_fee: number;
  total_net: number;
  total_photographer: number;
  total_director: number;
  pending_liquidation: number;
  settled: number;
  avg_photographer_pct: number;
  avg_director_pct: number;
  avg_gateway_pct: number;
}

interface ReportData {
  success: boolean;
  data: ReportItem[];
  totals: ReportTotals;
  filters_applied: {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    fotografo_id: string | null;
    estado_liquidacion: string | null;
  };
}

export default function ReportesPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fotografoId, setFotografoId] = useState('all');
  const [estadoLiquidacion, setEstadoLiquidacion] = useState('all');

  useEffect(() => {
    fetchPhotographers();
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setFechaInicio(firstDay.toISOString().split('T')[0]);
    setFechaFin(lastDay.toISOString().split('T')[0]);
  }, []);

  async function fetchPhotographers() {
    try {
      const response = await fetch('/api/photographers?active=true');
      const result = await response.json();
      if (result.success) {
        setPhotographers(result.data);
      }
    } catch (error) {
      console.error('Error fetching photographers:', error);
    }
  }

  async function fetchReport() {
    if (!fechaInicio || !fechaFin) {
      setError('Debe seleccionar fecha de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado_liquidacion: estadoLiquidacion,
      });

      if (fotografoId !== 'all') {
        params.append('fotografo_id', fotografoId);
      }

      const response = await fetch(`/api/reportes/ventas?${params}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Error obteniendo reporte');
        return;
      }

      setReportData(result);
    } catch (error: any) {
      setError(error.message || 'Error generando reporte');
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (!reportData || reportData.data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Create CSV content
    const headers = [
      'ID Solicitud',
      'Fecha Pago',
      'Fecha Creación',
      'Cliente',
      'Email Cliente',
      'Galería',
      'Fotógrafo',
      'Email Fotógrafo',
      'Cantidad Fotos',
      'Precio por Foto',
      'Monto Bruto',
      'Comisión Gateway',
      '% Gateway',
      'Monto Neto',
      'Ganancia Fotógrafo',
      '% Fotógrafo',
      'Ganancia Director',
      '% Director',
      'Estado Liquidación',
      'Orden Flow',
      'Estado',
      'Verificación OK',
    ];

    const rows = reportData.data.map(item => [
      item.id,
      new Date(item.payment_date).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }),
      new Date(item.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }),
      item.client_name,
      item.client_email,
      item.gallery_title,
      item.photographer_name,
      item.photographer_email || '',
      item.photo_count,
      item.price_per_photo,
      item.gross_amount,
      item.gateway_fee,
      item.gateway_fee_pct.toFixed(2),
      item.net_amount,
      item.photographer_share,
      item.photographer_pct.toFixed(2),
      item.director_share,
      item.director_pct.toFixed(2),
      item.settlement_status === 'settled' ? 'Liquidado' : 'Pendiente',
      item.flow_order || '',
      item.status,
      item.all_checks_pass ? 'Sí' : 'No',
    ]);

    // Add totals row
    rows.push([
      'TOTALES',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      reportData.totals.total_photos.toString(),
      '',
      reportData.totals.total_gross.toString(),
      reportData.totals.total_gateway_fee.toString(),
      reportData.totals.avg_gateway_pct.toFixed(2),
      reportData.totals.total_net.toString(),
      reportData.totals.total_photographer.toString(),
      reportData.totals.avg_photographer_pct.toFixed(2),
      reportData.totals.total_director.toString(),
      reportData.totals.avg_director_pct.toFixed(2),
      `${reportData.totals.settled} liquidadas / ${reportData.totals.pending_liquidation} pendientes`,
      '',
      '',
      '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-ventas-${fechaInicio}-${fechaFin}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
        <p className="mt-2 text-gray-600">
          Resumen completo de todas las ventas realizadas con desglose de comisiones
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-devil-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-devil-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotógrafo
            </label>
            <select
              value={fotografoId}
              onChange={(e) => setFotografoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-devil-500"
            >
              <option value="all">Todos</option>
              {photographers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Liquidación
            </label>
            <select
              value={estadoLiquidacion}
              onChange={(e) => setEstadoLiquidacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-devil-500"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="settled">Liquidadas</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-6 py-2 bg-devil-600 text-white rounded-md hover:bg-devil-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>

          {reportData && reportData.data.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {reportData && (
        <>
          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Solicitudes</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{reportData.totals.total_requests}</dd>
                    <dd className="text-xs text-gray-500">{reportData.totals.total_photos} fotos</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Brutos</dt>
                    <dd className="text-3xl font-semibold text-gray-900">${reportData.totals.total_gross.toLocaleString('es-CL')}</dd>
                    <dd className="text-xs text-gray-500">Gateway: ${reportData.totals.total_gateway_fee.toLocaleString('es-CL')} ({reportData.totals.avg_gateway_pct.toFixed(1)}%)</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fotógrafos</dt>
                    <dd className="text-3xl font-semibold text-gray-900">${reportData.totals.total_photographer.toLocaleString('es-CL')}</dd>
                    <dd className="text-xs text-gray-500">{reportData.totals.avg_photographer_pct.toFixed(1)}% promedio</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Director</dt>
                    <dd className="text-3xl font-semibold text-gray-900">${reportData.totals.total_director.toLocaleString('es-CL')}</dd>
                    <dd className="text-xs text-gray-500">{reportData.totals.avg_director_pct.toFixed(1)}% promedio</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidation Status */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Liquidaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totals.pending_liquidation}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Liquidadas</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totals.settled}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_requests}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Detalle de Ventas</h3>
            </div>

            {reportData.data.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No hay datos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron ventas en el período y filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Galería</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fotógrafo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fotos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bruto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fotógrafo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Director</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Liquidación</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.payment_date).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'America/Santiago',
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.client_name}</div>
                          <div className="text-xs text-gray-500">{item.client_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/galerias/${item.gallery_slug}`}
                            target="_blank"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {item.gallery_title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.photographer_name}</div>
                          {item.photographer_email && (
                            <div className="text-xs text-gray-500">{item.photographer_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {item.photo_count}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${item.gross_amount.toLocaleString('es-CL')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                          ${item.gateway_fee.toLocaleString('es-CL')}
                          <div className="text-xs">({item.gateway_fee_pct.toFixed(1)}%)</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          ${item.net_amount.toLocaleString('es-CL')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="font-medium text-purple-600">${item.photographer_share.toLocaleString('es-CL')}</div>
                          <div className="text-xs text-gray-500">({item.photographer_pct.toFixed(1)}%)</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="font-medium text-red-600">${item.director_share.toLocaleString('es-CL')}</div>
                          <div className="text-xs text-gray-500">({item.director_pct.toFixed(1)}%)</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.settlement_status === 'settled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.settlement_status === 'settled' ? 'Liquidado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {item.all_checks_pass ? (
                            <span className="inline-flex items-center text-green-600" title="Todas las verificaciones pasaron">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600" title="Error en verificación de datos">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Totals row */}
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-900" colSpan={4}>
                        TOTALES
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        {reportData.totals.total_photos}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        ${reportData.totals.total_gross.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        ${reportData.totals.total_gateway_fee.toLocaleString('es-CL')}
                        <div className="text-xs font-normal text-gray-500">
                          ({reportData.totals.avg_gateway_pct.toFixed(1)}% prom)
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        ${reportData.totals.total_net.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-purple-600">
                        ${reportData.totals.total_photographer.toLocaleString('es-CL')}
                        <div className="text-xs font-normal text-gray-500">
                          ({reportData.totals.avg_photographer_pct.toFixed(1)}% prom)
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-red-600">
                        ${reportData.totals.total_director.toLocaleString('es-CL')}
                        <div className="text-xs font-normal text-gray-500">
                          ({reportData.totals.avg_director_pct.toFixed(1)}% prom)
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-gray-500">
                        {reportData.totals.settled} liquidadas
                        <br />
                        {reportData.totals.pending_liquidation} pendientes
                      </td>
                      <td className="px-4 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

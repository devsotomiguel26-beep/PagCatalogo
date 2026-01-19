'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Settlement {
  id: string;
  settlement_date: string;
  period_start: string;
  period_end: string;
  recipient_type: 'photographer' | 'director';
  recipient_id: string | null;
  recipient_name: string;
  total_amount: number;
  photo_request_ids: string[];
  payment_method: string | null;
  payment_proof_url: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface Photographer {
  id: string;
  name: string;
  email: string | null;
}

interface PreviewRequest {
  request_id: string;
  gallery_title: string;
  client_name: string;
  request_date: string;
  photo_count: number;
  photographer_share: number;
  director_share: number;
}

interface PreviewData {
  requests: PreviewRequest[];
  total_amount: number;
  request_ids: string[];
  total_requests: number;
  total_photos: number;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [recipientType, setRecipientType] = useState<'photographer' | 'director'>('photographer');
  const [recipientId, setRecipientId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [notes, setNotes] = useState('');

  // Preview state
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch settlements
      const settlementsRes = await fetch('/api/settlements');
      const settlementsResult = await settlementsRes.json();
      if (settlementsResult.success) {
        setSettlements(settlementsResult.data);
      }

      // Fetch photographers
      const photographersRes = await fetch('/api/photographers?active=true');
      const photographersResult = await photographersRes.json();
      if (photographersResult.success) {
        setPhotographers(photographersResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    // Set default dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    setPeriodEnd(endDate.toISOString().split('T')[0]);
    setPeriodStart(startDate.toISOString().split('T')[0]);
    setRecipientType('photographer');
    setRecipientId(photographers[0]?.id || '');
    setPaymentMethod('transferencia');
    setNotes('');
    setPreview(null);
    setError('');
    setStep(1);
    setShowNewModal(true);
  }

  async function handleGeneratePreview() {
    if (!periodStart || !periodEnd) {
      setError('Debe seleccionar un período');
      return;
    }

    if (recipientType === 'photographer' && !recipientId) {
      setError('Debe seleccionar un fotógrafo');
      return;
    }

    try {
      setLoadingPreview(true);
      setError('');

      const response = await fetch('/api/settlements/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          recipient_type: recipientType,
          recipient_id: recipientType === 'photographer' ? recipientId : null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      setPreview(result.data);

      if (result.data.total_requests === 0) {
        setError(result.data.message || 'No hay ganancias pendientes en el período seleccionado');
        return;
      }

      setStep(2);
    } catch (error: any) {
      setError(error.message || 'Error generando preview');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleCreateSettlement() {
    if (!preview || preview.request_ids.length === 0) {
      setError('No hay solicitudes para incluir');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          recipient_type: recipientType,
          recipient_id: recipientType === 'photographer' ? recipientId : null,
          photo_request_ids: preview.request_ids,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
          created_by: 'admin',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      alert('Liquidación creada exitosamente');
      setShowNewModal(false);
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Error creando liquidación');
    } finally {
      setCreating(false);
    }
  }

  async function handleMarkAsPaid(settlementId: string) {
    if (!confirm('¿Confirma que realizó el pago y desea marcar esta liquidación como pagada?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  }

  async function handleCancelSettlement(settlementId: string) {
    if (!confirm('¿Está seguro de cancelar esta liquidación? Las solicitudes volverán a estado pendiente.')) {
      return;
    }

    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
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
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="mt-2 text-gray-600">
            Genera y gestiona los pagos a fotógrafos y director
          </p>
        </div>
        <button
          onClick={openNewModal}
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
          Nueva Liquidación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Liquidaciones</dt>
                <dd className="text-3xl font-semibold text-gray-900">{settlements.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pagadas</dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {settlements.filter(s => s.status === 'paid').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {settlements.filter(s => s.status === 'pending').length}
                </dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Monto Pagado</dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  ${settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('es-CL')}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Liquidaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay liquidaciones creadas aún.{' '}
                    <button onClick={openNewModal} className="text-red-600 hover:text-red-900 font-medium">
                      Crear la primera
                    </button>
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(settlement.settlement_date).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{settlement.recipient_name}</div>
                      <div className="text-sm text-gray-500">
                        {settlement.recipient_type === 'photographer' ? 'Fotógrafo' : 'Director'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(settlement.period_start).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })} -{' '}
                      {new Date(settlement.period_end).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${settlement.total_amount.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                          settlement.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : settlement.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {settlement.status === 'paid' ? 'Pagado' : settlement.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/liquidaciones/${settlement.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Ver Detalle
                      </Link>
                      {settlement.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMarkAsPaid(settlement.id)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Marcar Pagada
                          </button>
                          <button
                            onClick={() => handleCancelSettlement(settlement.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Settlement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Nueva Liquidación - Paso {step} de 2
              </h3>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destinatario *
                    </label>
                    <select
                      value={recipientType}
                      onChange={(e) => {
                        setRecipientType(e.target.value as 'photographer' | 'director');
                        if (e.target.value === 'photographer') {
                          setRecipientId(photographers[0]?.id || '');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="photographer">Fotógrafo</option>
                      <option value="director">Director</option>
                    </select>
                  </div>

                  {recipientType === 'photographer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Fotógrafo *
                      </label>
                      <select
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {photographers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.email && `(${p.email})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Notas o comentarios adicionales"
                    />
                  </div>
                </div>
              )}

              {step === 2 && preview && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Resumen de la Liquidación</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Destinatario:</span>
                        <span className="ml-2 font-medium">
                          {recipientType === 'photographer'
                            ? photographers.find(p => p.id === recipientId)?.name
                            : process.env.NEXT_PUBLIC_DIRECTOR_NAME || 'Director'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Período:</span>
                        <span className="ml-2 font-medium">
                          {new Date(periodStart).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })} - {new Date(periodEnd).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Solicitudes:</span>
                        <span className="ml-2 font-medium">{preview.total_requests}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Fotos:</span>
                        <span className="ml-2 font-medium">{preview.total_photos}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-700">Monto Total:</span>
                        <span className="ml-2 font-bold text-lg text-blue-900">
                          ${preview.total_amount.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Solicitudes Incluidas:</h4>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Galería</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fotos</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.requests.map((req) => (
                            <tr key={req.request_id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{req.gallery_title}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{req.client_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(req.request_date).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{req.photo_count}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                ${Math.round(recipientType === 'photographer' ? req.photographer_share : req.director_share).toLocaleString('es-CL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                )}
                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={loadingPreview}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingPreview ? 'Generando...' : 'Ver Preview'}
                  </button>
                )}
                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleCreateSettlement}
                    disabled={creating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {creating ? 'Creando...' : 'Crear Liquidación'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

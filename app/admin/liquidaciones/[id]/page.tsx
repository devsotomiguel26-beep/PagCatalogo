'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  requests?: Array<{
    id: string;
    client_name: string;
    created_at: string;
    photo_ids: string[];
    transaction_details: any;
    galleries: {
      title: string;
    };
  }>;
}

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSettlement();
  }, [settlementId]);

  async function fetchSettlement() {
    try {
      setLoading(true);
      const response = await fetch(`/api/settlements/${settlementId}`);
      const result = await response.json();

      if (!result.success) {
        alert('Error: ' + result.error);
        router.push('/admin/liquidaciones');
        return;
      }

      setSettlement(result.data);
      setPaymentMethod(result.data.payment_method || 'transferencia');
      setPaymentNotes(result.data.notes || '');
    } catch (error: any) {
      console.error('Error fetching settlement:', error);
      alert('Error al cargar liquidación');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    if (!confirm('¿Confirma que realizó el pago? Esta acción actualizará el estado de todas las solicitudes incluidas.')) {
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_method: paymentMethod,
          notes: paymentNotes.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setShowPaymentModal(false);
        fetchSettlement();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
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
        fetchSettlement();
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

  if (!settlement) {
    return null;
  }

  const recipientShare = (req: any) => {
    if (!req.transaction_details || !req.transaction_details.breakdown) return 0;
    return settlement.recipient_type === 'photographer'
      ? req.transaction_details.breakdown.photographer_share
      : req.transaction_details.breakdown.director_share;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/liquidaciones"
          className="text-red-600 hover:text-red-900 mb-4 inline-flex items-center text-sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Liquidaciones
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de Liquidación</h1>
            <p className="mt-2 text-gray-600">
              Liquidación #{settlementId.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            {settlement.status === 'pending' && (
              <>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Marcar como Pagada
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar Liquidación
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settlement Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Estado</div>
          <span
            className={`inline-flex mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
              settlement.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : settlement.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {settlement.status === 'paid' ? 'Pagado' : settlement.status === 'pending' ? 'Pendiente' : 'Cancelado'}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Monto Total</div>
          <div className="text-3xl font-bold text-gray-900">
            ${settlement.total_amount.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Solicitudes</div>
          <div className="text-3xl font-bold text-gray-900">
            {settlement.photo_request_ids.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {settlement.requests?.reduce((sum, r) => sum + (r.photo_ids?.length || 0), 0)} fotos
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Método de Pago</div>
          <div className="text-lg font-medium text-gray-900">
            {settlement.payment_method || 'No especificado'}
          </div>
        </div>
      </div>

      {/* Recipient Info */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Destinatario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Nombre:</span>
            <p className="mt-1 text-sm text-gray-900">{settlement.recipient_name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Tipo:</span>
            <p className="mt-1 text-sm text-gray-900">
              {settlement.recipient_type === 'photographer' ? 'Fotógrafo' : 'Director'}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Período:</span>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(settlement.period_start).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })} -{' '}
              {new Date(settlement.period_end).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Fecha de Liquidación:</span>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(settlement.settlement_date).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
            </p>
          </div>
          {settlement.notes && (
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-500">Notas:</span>
              <p className="mt-1 text-sm text-gray-900">{settlement.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Solicitudes Incluidas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Galería
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fotos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlement.requests && settlement.requests.length > 0 ? (
                settlement.requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.galleries?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.photo_ids?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${Math.round(recipientShare(request)).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay detalles de solicitudes disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Pago</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Al marcar como pagada, todas las solicitudes incluidas se actualizarán a estado "settled"
                  y ya no aparecerán como pendientes.
                </p>
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
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Número de transferencia, comprobante, etc."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Monto a pagar:</span>
                  <span className="text-xl font-bold text-blue-900">
                    ${settlement.total_amount.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

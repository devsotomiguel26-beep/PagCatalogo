'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import ResendPhotosModal from '@/components/admin/ResendPhotosModal';
import PaymentDetailsModal from '@/components/admin/PaymentDetailsModal';

interface PhotoRequest {
  id: string;
  gallery_id: string | null;
  photo_ids: string[];
  client_name: string;
  client_email: string;
  client_phone?: string;
  child_name: string;
  status: string;
  created_at: string;
  photos_sent_at?: string | null;
  download_links_expires_at?: string | null;
  gallery_title?: string;
  gallery_slug?: string;
  flow_order?: number | null;
  payment_data?: any;
  is_test?: boolean;
  is_archived?: boolean;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancel_reason?: string | null;
  galleries: {
    title: string;
    slug: string;
  } | null;
}

interface Photo {
  id: string;
  public_url: string;
}

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'active' | 'all' | 'archived' | 'abandoned' | 'test'>('active');
  const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(null);
  const [requestPhotos, setRequestPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [resendModalRequest, setResendModalRequest] = useState<PhotoRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalRequest, setPaymentModalRequest] = useState<PhotoRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter, viewFilter]);

  async function fetchRequests() {
    setLoading(true);

    let query = supabase
      .from('photo_requests')
      .select(`
        *,
        galleries (
          title,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    // View filters (is_test, is_archived)
    if (viewFilter === 'active') {
      // Excluir pruebas y archivadas
      query = query.not('is_test', 'eq', true).not('is_archived', 'eq', true);
    } else if (viewFilter === 'test') {
      query = query.eq('is_test', true);
    } else if (viewFilter === 'archived') {
      query = query.eq('is_archived', true);
    } else if (viewFilter === 'abandoned') {
      query = query.eq('status', 'abandoned');
    }
    // 'all' = no filter

    // Status filter
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data as PhotoRequest[]);
    }

    setLoading(false);
  }

  async function updateStatus(requestId: string, newStatus: string) {
    const { error } = await supabase
      .from('photo_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } else {
      fetchRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    }
  }

  async function markAsTest(requestId: string) {
    if (!confirm('¿Marcar esta solicitud como prueba? No aparecerá en reportes ni liquidaciones.')) {
      return;
    }

    const { error } = await supabase
      .from('photo_requests')
      .update({ is_test: true })
      .eq('id', requestId);

    if (error) {
      console.error('Error marking as test:', error);
      alert('Error al marcar como prueba');
    } else {
      fetchRequests();
      alert('Solicitud marcada como prueba');
    }
  }

  async function cancelRequest(requestId: string) {
    const reason = prompt('Razón de la cancelación:');
    if (!reason) return;

    const { error } = await supabase
      .from('photo_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'admin',
        cancel_reason: reason,
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error cancelling request:', error);
      alert('Error al cancelar la solicitud');
    } else {
      fetchRequests();
      alert('Solicitud cancelada');
    }
  }

  async function viewPhotos(request: PhotoRequest) {
    setSelectedRequest(request);
    setLoadingPhotos(true);

    const { data, error } = await supabase
      .from('photos')
      .select('id, public_url')
      .in('id', request.photo_ids);

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setRequestPhotos(data as Photo[]);
    }

    setLoadingPhotos(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  // Función para obtener el estado de entrega
  const getDeliveryStatus = (request: PhotoRequest) => {
    if (!request.photos_sent_at) {
      return {
        label: 'No enviado',
        color: 'bg-gray-100 text-gray-800',
        icon: '⏸️',
      };
    }

    if (!request.download_links_expires_at) {
      return {
        label: 'Enviado',
        color: 'bg-green-100 text-green-800',
        icon: '✅',
      };
    }

    const expiryDate = new Date(request.download_links_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: 'Enlaces expirados',
        color: 'bg-red-100 text-red-800',
        icon: '⚠️',
      };
    }

    if (diffDays <= 2) {
      return {
        label: `Expira en ${diffDays}d`,
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⏰',
      };
    }

    return {
      label: `Enviado (${diffDays}d restantes)`,
      color: 'bg-green-100 text-green-800',
      icon: '✅',
    };
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    delivered: 'bg-blue-100 text-blue-800',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    abandoned: 'bg-orange-100 text-orange-800',
  };

  const statusLabels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    delivered: 'Entregado',
    expired: 'Enlaces expirados',
    cancelled: 'Cancelado',
    abandoned: 'Abandonado',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Fotos</h1>
        <p className="mt-2 text-gray-600">
          Gestiona las solicitudes de compra de fotos de los clientes
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 space-y-4">
        {/* View Filter */}
        <div className="flex items-center space-x-4 flex-wrap gap-2 pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Vista:</span>
          {[
            { value: 'active', label: '✅ Activas', description: 'Excluye pruebas y archivadas' },
            { value: 'all', label: '📋 Todas', description: 'Incluye todo' },
            { value: 'test', label: '🧪 Pruebas', description: 'Solo pruebas' },
            { value: 'abandoned', label: '🗑️ Abandonadas', description: 'Pendientes >48h' },
            { value: 'archived', label: '📦 Archivadas', description: 'Historial antiguo' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setViewFilter(option.value as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewFilter === option.value
                  ? 'bg-devil-100 text-devil-700 border-2 border-devil-400'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Estado:</span>
          {[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'paid', label: 'Pagadas' },
            { value: 'delivered', label: 'Entregadas' },
            { value: 'expired', label: 'Expiradas' },
            { value: 'cancelled', label: 'Canceladas' },
            { value: 'abandoned', label: 'Abandonadas' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === option.value
                  ? 'bg-devil-100 text-devil-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-devil-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <>
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}
                {viewFilter === 'active' && ' (productivas)'}
                {viewFilter === 'test' && ' (de prueba)'}
                {viewFilter === 'abandoned' && ' (abandonadas)'}
                {viewFilter === 'archived' && ' (archivadas)'}
              </p>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Niño/a
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Galería
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Fotos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Estado Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const deliveryStatus = getDeliveryStatus(request);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'America/Santiago',
                          })}
                          <br />
                          <span className="text-xs">
                            {new Date(request.created_at).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'America/Santiago',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {request.client_name}
                            {request.is_test && (
                              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                🧪 Prueba
                              </span>
                            )}
                            {request.is_archived && (
                              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                📦 Archivada
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {request.client_email}
                            <button
                              onClick={() => copyToClipboard(request.client_email)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Copiar email"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          {request.client_phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {request.client_phone}
                              <button
                                onClick={() => copyToClipboard(request.client_phone!)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Copiar teléfono"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.child_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {request.galleries ? (
                            <Link
                              href={`/galerias/${request.galleries.slug}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {request.galleries.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500">
                              {request.gallery_title || 'Galería eliminada'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.photo_ids.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${deliveryStatus.color}`}
                          >
                            <span>{deliveryStatus.icon}</span>
                            <span>{deliveryStatus.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={request.status}
                            onChange={(e) => updateStatus(request.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${
                              statusColors[request.status as keyof typeof statusColors]
                            }`}
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => viewPhotos(request)}
                              className="text-devil-600 hover:text-devil-900 text-left"
                            >
                              Ver fotos
                            </button>
                            <button
                              onClick={() => setResendModalRequest(request)}
                              className="text-blue-600 hover:text-blue-900 text-left flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {request.photos_sent_at ? 'Reenviar' : 'Enviar'} fotos
                            </button>
                            {request.payment_data && request.status !== 'pending' && (
                              <button
                                onClick={() => {
                                  setPaymentModalRequest(request);
                                  setShowPaymentModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 text-left flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Ver Pago
                              </button>
                            )}
                            <div className="border-t border-gray-200 my-1"></div>
                            {!request.is_test && (
                              <button
                                onClick={() => markAsTest(request.id)}
                                className="text-purple-600 hover:text-purple-900 text-left flex items-center gap-1"
                                title="Marcar como prueba"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.586V5L7 4z" />
                                </svg>
                                Marcar como Prueba
                              </button>
                            )}
                            {request.status === 'pending' && !request.is_test && (
                              <button
                                onClick={() => cancelRequest(request.id)}
                                className="text-red-600 hover:text-red-900 text-left flex items-center gap-1"
                                title="Cancelar solicitud"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No hay solicitudes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Las solicitudes de fotos aparecerán aquí.
            </p>
          </div>
        )}
      </div>

      {/* Modal de fotos */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Fotos solicitadas por {selectedRequest.client_name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRequest.galleries?.title} • {selectedRequest.photo_ids.length} fotos
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingPhotos ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-devil-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {requestPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={photo.public_url}
                        alt="Foto solicitada"
                        fill
                        className="object-cover"
                        sizes="200px"
                        unoptimized={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de reenvío de fotos */}
      {resendModalRequest && (
        <ResendPhotosModal
          request={resendModalRequest}
          onClose={() => setResendModalRequest(null)}
          onSuccess={() => {
            fetchRequests();
            alert('Fotos enviadas exitosamente');
          }}
        />
      )}

      {/* Modal de detalles de pago */}
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentModalRequest(null);
        }}
        paymentData={paymentModalRequest?.payment_data}
        clientName={paymentModalRequest?.client_name || ''}
        clientEmail={paymentModalRequest?.client_email || ''}
        galleryTitle={paymentModalRequest?.galleries?.title || ''}
        photoCount={paymentModalRequest?.photo_ids?.length || 0}
        requestId={paymentModalRequest?.id || ''}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

interface PhotoRequest {
  id: string;
  gallery_id: string;
  photo_ids: string[];
  client_name: string;
  client_email: string;
  client_phone?: string;
  child_name: string;
  status: string;
  created_at: string;
  photos_sent_at?: string;
  download_links_expires_at?: string;
  galleries: {
    title: string;
    slug: string;
  };
}

interface Photo {
  id: string;
  public_url: string;
}

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(null);
  const [requestPhotos, setRequestPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [sendingPhotos, setSendingPhotos] = useState(false);
  const [confirmSendRequest, setConfirmSendRequest] = useState<PhotoRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

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

  async function sendPhotosToClient(requestId: string) {
    setSendingPhotos(true);
    try {
      const response = await fetch('/api/send-photos-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Fotos enviadas exitosamente. ${data.photosSent} fotos enviadas.`);
        fetchRequests();
      } else {
        alert(`❌ Error al enviar fotos: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error sending photos:', error);
      alert('❌ Error al enviar fotos. Revisa la consola para más detalles.');
    } finally {
      setSendingPhotos(false);
      setConfirmSendRequest(null);
    }
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

      // AUTO-SEND: Si cambia a "paid", enviar fotos automáticamente
      if (newStatus === 'paid') {
        const request = requests.find((r) => r.id === requestId);
        if (request && !request.photos_sent_at) {
          console.log('🚀 Auto-enviando fotos al cambiar estado a "Pagado"...');
          await sendPhotosToClient(requestId);
        }
      }
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

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    pending: 'Pendiente',
    contacted: 'Contactado',
    paid: 'Pagado',
    delivered: 'Entregado',
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
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Mostrar:</span>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'contacted', label: 'Contactadas' },
            { value: 'paid', label: 'Pagadas' },
            { value: 'delivered', label: 'Entregadas' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === option.value
                  ? 'bg-red-100 text-red-700'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <>
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Niño/a
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Galería
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fotos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fotos Enviadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        <br />
                        <span className="text-xs">
                          {new Date(request.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.client_name}
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
                        <Link
                          href={`/galerias/${request.galleries.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {request.galleries.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.photo_ids.length}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.photos_sent_at ? (
                          <div className="flex flex-col">
                            <span className="text-green-600 font-medium">✓ Enviadas</span>
                            <span className="text-xs text-gray-500">
                              {new Date(request.photos_sent_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            {request.download_links_expires_at && (
                              <span className="text-xs text-gray-400">
                                Expiran: {new Date(request.download_links_expires_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewPhotos(request)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ver fotos
                          </button>
                          {request.status === 'paid' && !request.photos_sent_at && (
                            <button
                              onClick={() => setConfirmSendRequest(request)}
                              disabled={sendingPhotos}
                              className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sendingPhotos ? 'Enviando...' : 'Enviar Fotos'}
                            </button>
                          )}
                        </div>
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
                  {selectedRequest.galleries.title} • {selectedRequest.photo_ids.length} fotos
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para enviar fotos */}
      {confirmSendRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Confirmar Envío de Fotos
              </h3>

              <div className="text-sm text-gray-600 mb-4">
                <p className="mb-2">Estás a punto de enviar las fotos a:</p>
                <ul className="space-y-1 bg-gray-50 p-3 rounded">
                  <li><strong>Cliente:</strong> {confirmSendRequest.client_name}</li>
                  <li><strong>Email:</strong> {confirmSendRequest.client_email}</li>
                  <li><strong>Fotos:</strong> {confirmSendRequest.photo_ids.length}</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  Se generarán links de descarga válidos por 7 días.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmSendRequest(null)}
                  disabled={sendingPhotos}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => sendPhotosToClient(confirmSendRequest.id)}
                  disabled={sendingPhotos}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {sendingPhotos ? 'Enviando...' : 'Enviar Fotos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

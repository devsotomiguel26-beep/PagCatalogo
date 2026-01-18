'use client';

interface PaymentData {
  flowOrder?: number;
  commerceOrder?: string;
  amount?: number;
  status?: number;
  paymentType?: number;
  paymentData?: {
    date?: string;
    media?: string;
    conversionDate?: string;
    conversionRate?: number;
    amount?: number;
    currency?: string;
    fee?: number;
    balance?: number;
    transferDate?: string;
  };
  payer?: string;
  date?: string;
  fee?: number;
  balance?: number;
  captured_at?: string;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentData | null;
  clientName: string;
  clientEmail: string;
  galleryTitle: string;
  photoCount: number;
  requestId: string;
}

export default function PaymentDetailsModal({
  isOpen,
  onClose,
  paymentData,
  clientName,
  clientEmail,
  galleryTitle,
  photoCount,
  requestId,
}: PaymentDetailsModalProps) {
  if (!isOpen) return null;

  const getPaymentTypeLabel = (type?: number) => {
    switch (type) {
      case 1: return 'Webpay Plus';
      case 2: return 'Servipag';
      case 3: return 'Multicaja';
      case 9: return 'Transferencia';
      default: return 'Desconocido';
    }
  };

  const getPaymentMediaLabel = (media?: string) => {
    switch (media) {
      case '1': return 'Tarjeta de Crédito';
      case '2': return 'Tarjeta de Débito';
      case '3': return 'Transferencia';
      default: return media || 'No especificado';
    }
  };

  const getStatusLabel = (status?: number) => {
    switch (status) {
      case 1: return 'Pendiente';
      case 2: return 'Pagado';
      case 3: return 'Rechazado';
      case 4: return 'Anulado';
      default: return 'Desconocido';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString('es-CL')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detalles del Pago</h3>
            <p className="text-sm text-gray-500 mt-1">
              Comprobante de pago - Flow Order #{paymentData?.flowOrder}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {!paymentData ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos de pago</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta solicitud no tiene información detallada del pago de Flow.
              </p>
            </div>
          ) : (
            <>
              {/* Client Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Nombre:</span>
                    <span className="ml-2 font-medium text-blue-900">{clientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Email:</span>
                    <span className="ml-2 font-medium text-blue-900">{clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Galería:</span>
                    <span className="ml-2 font-medium text-blue-900">{galleryTitle}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Fotos:</span>
                    <span className="ml-2 font-medium text-blue-900">{photoCount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-3">Resumen del Pago</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Monto Total:</span>
                    <span className="text-2xl font-bold text-green-900">
                      {formatAmount(paymentData.amount)}
                    </span>
                  </div>
                  {paymentData.fee !== undefined && paymentData.fee > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-sm text-green-700">Comisión Flow:</span>
                      <span className="text-sm font-medium text-green-900">
                        -{formatAmount(paymentData.fee)}
                      </span>
                    </div>
                  )}
                  {paymentData.balance !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Neto Recibido:</span>
                      <span className="text-lg font-bold text-green-900">
                        {formatAmount(paymentData.balance)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="text-sm text-green-700">Estado:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      paymentData.status === 2
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusLabel(paymentData.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Flow Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Detalles de la Transacción</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Flow Order:</span>
                      <span className="ml-2 font-mono font-medium text-gray-900">
                        #{paymentData.flowOrder}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Order ID:</span>
                      <span className="ml-2 font-mono text-xs font-medium text-gray-900">
                        {requestId.substring(0, 13)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo de Pago:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {getPaymentTypeLabel(paymentData.paymentType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Medio:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {getPaymentMediaLabel(paymentData.paymentData?.media)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Fecha de Pago:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(paymentData.date || paymentData.paymentData?.date)}
                      </span>
                    </div>
                    {paymentData.payer && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Pagador:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {paymentData.payer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Payment Data */}
              {paymentData.paymentData && Object.keys(paymentData.paymentData).length > 2 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Información Adicional</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {paymentData.paymentData.conversionDate && (
                        <div>
                          <span className="text-gray-600">Fecha Conversión:</span>
                          <span className="ml-2 text-gray-900">
                            {formatDate(paymentData.paymentData.conversionDate)}
                          </span>
                        </div>
                      )}
                      {paymentData.paymentData.currency && (
                        <div>
                          <span className="text-gray-600">Moneda:</span>
                          <span className="ml-2 text-gray-900">
                            {paymentData.paymentData.currency}
                          </span>
                        </div>
                      )}
                      {paymentData.paymentData.transferDate && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Fecha Transferencia:</span>
                          <span className="ml-2 text-gray-900">
                            {formatDate(paymentData.paymentData.transferDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Capture Info */}
              {paymentData.captured_at && (
                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  Información capturada el {formatDate(paymentData.captured_at)}
                </div>
              )}

              {/* Link to Flow (if needed) */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Nota:</strong> Esta información proviene directamente de Flow (pasarela de pago).
                      Para más detalles, consulta tu panel de Flow con el Order #{paymentData.flowOrder}.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

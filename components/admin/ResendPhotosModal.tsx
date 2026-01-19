'use client';

import { useState } from 'react';

interface ResendPhotosModalProps {
  request: {
    id: string;
    client_name: string;
    client_email: string;
    child_name: string;
    photo_ids: string[];
    photos_sent_at?: string | null;
    download_links_expires_at?: string | null;
    galleries: {
      title: string;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResendPhotosModal({
  request,
  onClose,
  onSuccess,
}: ResendPhotosModalProps) {
  const [email, setEmail] = useState(request.client_email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validar email en tiempo real
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('El email es requerido');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Formato de email inválido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  // Verificar si los enlaces expiraron
  const linksExpired = request.download_links_expires_at
    ? new Date(request.download_links_expires_at) < new Date()
    : true;

  const neverSent = !request.photos_sent_at;

  // Calcular días restantes o expirados
  const getDaysUntilExpiration = () => {
    if (!request.download_links_expires_at) return null;
    const expiryDate = new Date(request.download_links_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysUntilExpiration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/resend-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          newEmail: email !== request.client_email ? email : null,
          sentBy: 'admin', // Podrías obtener esto del contexto de auth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al reenviar fotos');
      }

      const data = await response.json();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error resending photos:', err);
      setError(err.message || 'Error al reenviar fotos. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {neverSent ? 'Enviar' : 'Reenviar'} Fotos al Cliente
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {request.client_name} • {request.photo_ids.length} fotos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estado actual de la entrega */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Estado actual de la entrega</h3>

            {neverSent ? (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Las fotos nunca han sido enviadas</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Este es el primer envío para esta solicitud
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    <strong>Último envío:</strong>{' '}
                    {new Date(request.photos_sent_at!).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Santiago',
                    })}
                  </span>
                </div>

                {daysRemaining !== null && (
                  <div className="flex items-start gap-2">
                    {linksExpired ? (
                      <>
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Enlaces expirados hace {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'día' : 'días'}
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            Se regenerarán nuevos enlaces automáticamente al reenviar
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-700">
                          <strong>Enlaces válidos por:</strong> {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} más
                        </p>
                      </>
                    )}
                  </div>
                )}

              </>
            )}
          </div>

          {/* Formulario de reenvío */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de destino
                {email !== request.client_email && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (se actualizará el email del cliente)
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-3 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-devil-600 focus:border-transparent ${
                    emailError
                      ? 'border-red-300 text-red-900'
                      : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="cliente@ejemplo.com"
                  disabled={isSubmitting}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Al reenviar las fotos:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Se generarán nuevos enlaces de descarga válidos por 7 días</li>
                    <li>El cliente recibirá un email con todas las fotos</li>
                    <li>Se registrará este envío en el historial</li>
                    {email !== request.client_email && (
                      <li className="font-medium">El email del cliente se actualizará a: {email}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!emailError || !email}
                className="flex-1 px-4 py-2 bg-devil-600 text-white rounded-lg text-sm font-medium hover:bg-devil-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {neverSent ? 'Enviar' : 'Reenviar'} Fotos
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  public_url: string;
}

interface RequestPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  galleryTitle: string;
  galleryId: string;
  onSubmit: (data: {
    parentName: string;
    email: string;
    phone: string;
    childName: string;
  }) => Promise<void>;
}

export default function RequestPhotosModal({
  isOpen,
  onClose,
  photos,
  galleryTitle,
  onSubmit,
}: RequestPhotosModalProps) {
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({ parentName, email, phone, childName });

      // Reset form
      setParentName('');
      setEmail('');
      setPhone('');
      setChildName('');

      // Close modal after short delay
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75 animate-fadeIn">
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitar Fotos</h2>
            <p className="text-sm text-gray-600 mt-1">{galleryTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen de fotos seleccionadas */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="font-semibold">
                {photos.length} {photos.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
              </span>
            </div>

            {/* Preview de fotos */}
            <div className="grid grid-cols-6 gap-2">
              {photos.slice(0, 12).map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-gray-200 rounded overflow-hidden">
                  <Image
                    src={photo.public_url}
                    alt="Foto seleccionada"
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
              {photos.length > 12 && (
                <div className="relative aspect-square bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    +{photos.length - 12}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                Tu nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="parentName"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: María González"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="tu-email@ejemplo.com"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Te enviaremos la confirmación de tu solicitud a este correo
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: +56 9 1234 5678"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Te contactaremos para coordinar el pago
              </p>
            </div>

            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del niño/a <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="childName"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: Matías González"
                disabled={isSubmitting}
              />
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">¿Qué sucede después?</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Recibirás un email de confirmación</li>
                    <li>• Te contactaremos para coordinar el pago</li>
                    <li>• Una vez pagado, recibirás las fotos en alta resolución sin marca de agua</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Solicitud'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

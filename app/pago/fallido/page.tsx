'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Pago no completado
          </h1>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-center text-red-800 text-lg mb-4">
              No se pudo procesar tu pago.
            </p>
            <p className="text-center text-red-700 text-sm">
              Tu solicitud de fotos ha sido guardada, pero el pago no fue completado.
            </p>
          </div>

          {/* Possible Reasons */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-yellow-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Posibles causas:
            </h2>
            <ul className="space-y-2 text-yellow-800 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Cancelaste el proceso de pago</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>La transacción fue rechazada por el banco</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Fondos insuficientes en tu cuenta</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Problemas de conexión durante el proceso</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              ¿Qué puedo hacer ahora?
            </h2>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Contáctanos para reintentar el pago de tu solicitud</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Verifica que tu método de pago esté activo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Puedes crear una nueva solicitud cuando estés listo</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/galerias')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Volver a galerías
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Ir al inicio
            </button>
          </div>

          {/* Contact */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ¿Necesitas ayuda?{' '}
              <a
                href="mailto:contacto@diablosrojoscl.com"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Contáctanos
              </a>
              {' '}y te ayudaremos a completar tu pedido.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

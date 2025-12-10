'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-center text-green-800 text-lg mb-4">
              Tu pago ha sido procesado correctamente.
            </p>
            <p className="text-center text-green-700 text-sm">
              Recibirás un correo electrónico en los próximos minutos con los links de descarga de tus fotos en alta resolución.
            </p>
          </div>

          {/* Info Box */}
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
              Información importante:
            </h2>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Las fotos estarán disponibles en alta resolución sin marca de agua</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Los links de descarga expirarán en 7 días</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Te recomendamos descargar todas las fotos lo antes posible</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Si no recibes el correo en 10 minutos, revisa tu carpeta de spam</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/galerias')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Ver más galerías
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Volver al inicio
            </button>
          </div>

          {/* Contact */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ¿Tienes alguna pregunta o problema?{' '}
              <a
                href="mailto:contacto@diablosrojoscl.com"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

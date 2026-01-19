'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MigrationResult {
  id: string;
  client_name: string;
  photo_count?: number;
  gross_amount?: number;
  photographer_share?: number;
  director_share?: number;
  success: boolean;
  error?: string;
}

interface MigrationResponse {
  success: boolean;
  message: string;
  migrated: number;
  total: number;
  results: MigrationResult[];
}

export default function MigracionGananciasPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResponse | null>(null);
  const [error, setError] = useState('');

  async function handleMigrate() {
    if (!confirm('¿Estás seguro de ejecutar la migración?\n\nEsto calculará las ganancias para todas las solicitudes antiguas que no tienen transaction_details.')) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/settlements/migrate-old-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Error en la migración');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error ejecutando la migración');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/admin/dashboard" className="hover:text-red-600">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/admin/liquidaciones" className="hover:text-red-600">
              Liquidaciones
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Migración de Ganancias</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Migración de Ganancias</h1>
        <p className="mt-2 text-gray-600">
          Calcula las ganancias para solicitudes antiguas que fueron pagadas antes de implementar el sistema de distribución.
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg
            className="h-6 w-6 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ¿Qué hace esta migración?
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Busca todas las solicitudes pagadas SIN transaction_details</li>
              <li>Calcula la distribución de ganancias basándose en la configuración actual</li>
              <li>Asigna ganancias al fotógrafo asignado en cada galería</li>
              <li>Marca la comisión de Flow como "estimada" (no tenemos el valor real histórico)</li>
              <li>Permite generar liquidaciones para solicitudes antiguas</li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ IMPORTANTE: Esta acción es segura y se puede ejecutar múltiples veces. Solo procesa solicitudes que aún no tienen transaction_details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <button
          onClick={handleMigrate}
          disabled={loading}
          className="w-full py-4 px-6 bg-devil-600 text-white font-semibold rounded-lg hover:bg-devil-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-devil-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Ejecutando migración...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Ejecutar Migración
            </span>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-500 mt-0.5 mr-2"
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
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Migración Completada
                </h3>
                <p className="text-sm text-green-700 mb-3">{result.message}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-xs text-gray-500">Solicitudes migradas</p>
                    <p className="text-2xl font-bold text-green-600">{result.migrated}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-xs text-gray-500">Total procesadas</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          {result.results && result.results.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalle de Solicitudes Migradas
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fotos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fotógrafo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Director
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.results.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.client_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.photo_count || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${item.gross_amount?.toLocaleString('es-CL') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.photographer_share?.toLocaleString('es-CL') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.director_share?.toLocaleString('es-CL') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Migrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ✗ Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Próximos Pasos
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Ahora puedes crear liquidaciones para estos fotógrafos. Las solicitudes migradas aparecerán en el preview de liquidaciones.
            </p>
            <Link
              href="/admin/liquidaciones"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Liquidaciones
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

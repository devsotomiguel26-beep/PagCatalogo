'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ConfiguracionPage() {
  const [globalWatermarkUrl, setGlobalWatermarkUrl] = useState<string | null>(null);
  const [uploadingGlobal, setUploadingGlobal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGlobalWatermark();
  }, []);

  async function loadGlobalWatermark() {
    const { data, error } = await supabase.storage
      .from('gallery-images')
      .list('watermarks/global', {
        search: 'logo.png',
      });

    if (!error && data && data.length > 0) {
      const { data: urlData } = supabase.storage
        .from('gallery-images')
        .getPublicUrl('watermarks/global/logo.png');

      setGlobalWatermarkUrl(urlData.publicUrl + '?t=' + Date.now()); // Evitar cache
    }
  }

  async function handleUploadGlobal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.includes('png')) {
      setMessage({ type: 'error', text: 'Solo se permiten archivos PNG con transparencia' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El archivo es muy grande. Máximo 5MB.' });
      return;
    }

    setUploadingGlobal(true);
    setMessage(null);

    try {
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload('watermarks/global/logo.png', file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      setMessage({ type: 'success', text: 'Marca de agua global actualizada correctamente' });
      await loadGlobalWatermark();

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading global watermark:', error);
      setMessage({ type: 'error', text: `Error al subir: ${error.message}` });
    } finally {
      setUploadingGlobal(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/admin/dashboard" className="hover:text-red-600">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Configuración</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">
          Gestiona la configuración global del sistema
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Global Watermark Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Marca de Agua Global
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Esta marca de agua se aplicará a todas las galerías que no tengan una personalizada.
        </p>

        {/* Preview */}
        {globalWatermarkUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca de agua actual
            </label>
            <div className="inline-block bg-gray-100 p-4 rounded border border-gray-300">
              <img
                src={globalWatermarkUrl}
                alt="Marca de agua global"
                className="h-32 w-auto"
              />
            </div>
          </div>
        )}

        {/* Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleUploadGlobal}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingGlobal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingGlobal ? (
              <>
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Subiendo...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {globalWatermarkUrl ? 'Cambiar marca de agua global' : 'Subir marca de agua global'}
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Solo PNG con transparencia. Máximo 5MB. Recomendado: 1000-2000px de ancho.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400 mt-0.5"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Información importante
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Esta marca de agua se usará como predeterminada para todas las galerías</li>
                  <li>Cada galería puede tener su propia marca de agua personalizada</li>
                  <li>
                    Si existe el archivo /public/watermark/logo.png, se usará como fallback local
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

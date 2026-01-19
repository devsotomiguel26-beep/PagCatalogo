'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  public_url: string;
  storage_path: string;
  position?: number;
}

interface CoverPhotoSelectorProps {
  photos: Photo[];
  currentCoverPhotoId?: string | null;
  galleryId: string;
  onCoverPhotoSet: () => void;
}

export default function CoverPhotoSelector({
  photos,
  currentCoverPhotoId,
  galleryId,
  onCoverPhotoSet,
}: CoverPhotoSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    currentCoverPhotoId || null
  );

  async function handleSetCoverPhoto(photoId: string) {
    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch('/api/gallery/set-cover-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleryId,
          photoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al establecer la portada');
      }

      setSelectedPhotoId(photoId);
      onCoverPhotoSet();
    } catch (err: any) {
      console.error('Error setting cover photo:', err);
      setError(err.message || 'Error al establecer la portada');
    } finally {
      setIsUpdating(false);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Sube fotos primero para poder seleccionar una portada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
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
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Selecciona la foto de portada
            </h3>
            <p className="text-sm text-blue-700">
              Esta foto aparecerá como miniatura de la galería en la página principal. Haz click en la foto que quieras usar como portada.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => {
          const isCurrentCover = selectedPhotoId === photo.id;
          const isSelected = selectedPhotoId === photo.id;

          return (
            <button
              key={photo.id}
              onClick={() => handleSetCoverPhoto(photo.id)}
              disabled={isUpdating}
              className={`relative aspect-square group rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'ring-4 ring-devil-600 ring-offset-2 shadow-xl scale-105'
                  : 'ring-2 ring-transparent hover:ring-gray-300 hover:scale-102'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isCurrentCover ? 'Portada actual' : 'Click para establecer como portada'}
            >
              {/* Image */}
              <div className="relative w-full h-full bg-gray-100">
                <Image
                  src={photo.public_url}
                  alt="Foto"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  unoptimized={true}
                />
              </div>

              {/* Overlay cuando no es portada */}
              {!isSelected && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center p-2">
                    <svg
                      className="w-8 h-8 mx-auto mb-1"
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
                    <p className="text-xs font-medium">Usar como portada</p>
                  </div>
                </div>
              )}

              {/* Badge de portada actual */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 flex flex-col items-center justify-center">
                  <div className="bg-devil-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg mb-2">
                    ⭐ PORTADA
                  </div>
                  <svg
                    className="w-12 h-12 text-white drop-shadow-lg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}

              {/* Spinner al actualizar */}
              {isUpdating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg
                    className="animate-spin h-8 w-8 text-white"
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
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Cover Info */}
      {selectedPhotoId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-600 mr-2"
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
            <p className="text-sm text-green-800 font-medium">
              Portada establecida correctamente. Esta foto se mostrará en la página de galerías.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import FavoriteButton from './FavoriteButton';

interface Photo {
  id: string;
  public_url: string;
}

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  favorites: Set<string>;
  onToggleFavorite: (photoId: string) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  favorites,
  onToggleFavorite,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && !isLast) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onClose, onPrevious, onNext]);

  // Prevenir scroll del body cuando el lightbox está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center animate-fadeIn">
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-gray-800 rounded-full transition-colors z-10"
        aria-label="Cerrar"
      >
        <svg
          className="w-8 h-8"
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
      </button>

      {/* Barra superior con favorito y contador */}
      <div className="absolute top-4 left-4 right-20 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <FavoriteButton
            isFavorite={favorites.has(currentPhoto.id)}
            onToggle={() => onToggleFavorite(currentPhoto.id)}
          />
          <span className="text-white text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      </div>

      {/* Botón anterior */}
      {!isFirst && (
        <button
          onClick={onPrevious}
          className="absolute left-4 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
          aria-label="Foto anterior"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Imagen principal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative max-w-7xl max-h-full w-full h-full">
          <Image
            src={currentPhoto.public_url}
            alt={`Foto ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Botón siguiente */}
      {!isLast && (
        <button
          onClick={onNext}
          className="absolute right-4 p-3 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
          aria-label="Foto siguiente"
        >
          <svg
            className="w-8 h-8"
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
        </button>
      )}

      {/* Overlay clickeable para cerrar */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Cerrar lightbox"
      />
    </div>
  );
}

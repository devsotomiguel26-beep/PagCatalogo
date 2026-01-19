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

  // Prevenir clic derecho en imágenes
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Las fotos están protegidas. Todas las fotos incluyen marca de agua.');
    return false;
  };

  // Prevenir drag & drop
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

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
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center animate-fade-in">
      {/* Header minimalista */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-10 bg-white border-b border-gray-100">
        {/* Contador */}
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {photos.length}
        </span>

        {/* Botón favorito + cerrar */}
        <div className="flex items-center gap-4">
          <FavoriteButton
            isFavorite={favorites.has(currentPhoto.id)}
            onToggle={() => onToggleFavorite(currentPhoto.id)}
          />
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navegación minimalista */}
      {!isFirst && (
        <button
          onClick={onPrevious}
          className="absolute left-6 p-3 text-gray-400 hover:text-gray-900 transition-colors z-10"
          aria-label="Foto anterior"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Imagen principal - fondo blanco */}
      <div
        className="relative w-full h-full flex items-center justify-center pt-16 select-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      >
        <div className="relative max-w-6xl max-h-full w-full h-full p-8">
          <Image
            src={currentPhoto.public_url}
            alt={`Foto ${currentIndex + 1}`}
            fill
            className="object-contain pointer-events-none"
            sizes="100vw"
            quality={90}
            priority
            unoptimized={true}
            draggable={false}
          />
        </div>
      </div>

      {!isLast && (
        <button
          onClick={onNext}
          className="absolute right-6 p-3 text-gray-400 hover:text-gray-900 transition-colors z-10"
          aria-label="Foto siguiente"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Click en background para cerrar */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Cerrar lightbox"
      />
    </div>
  );
}

import Image from 'next/image';

interface Photo {
  id: string;
  public_url: string;
  position?: number;
}

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  favorites: Set<string>;
  onToggleFavorite?: (photoId: string) => void;
}

export default function PhotoGrid({ photos, onPhotoClick, favorites, onToggleFavorite }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
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
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No hay fotos en esta galería
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Esta galería aún no tiene fotos cargadas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => onPhotoClick(index)}
        >
          <Image
            src={photo.public_url}
            alt={`Foto ${index + 1}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Overlay en hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>

          {/* Botón de favorito */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
              className={`absolute top-2 right-2 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 ${
                favorites.has(photo.id)
                  ? 'bg-red-600'
                  : 'bg-white bg-opacity-80 hover:bg-opacity-100'
              }`}
              title={favorites.has(photo.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg
                className={`w-5 h-5 ${
                  favorites.has(photo.id) ? 'text-white' : 'text-gray-600'
                }`}
                fill={favorites.has(photo.id) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={favorites.has(photo.id) ? 0 : 2}
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

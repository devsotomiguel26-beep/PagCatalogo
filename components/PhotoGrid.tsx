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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer group"
          onClick={() => onPhotoClick(index)}
        >
          <Image
            src={photo.public_url}
            alt={`Foto ${index + 1}`}
            fill
            className="object-cover hover-subtle"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQ/9k="
          />

          {/* Checkbox minimalista en la esquina */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
              className={`absolute top-3 left-3 w-6 h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                favorites.has(photo.id)
                  ? 'bg-devil-600 border-devil-600'
                  : 'bg-white/90 border-white/90 hover:bg-white'
              }`}
              title={favorites.has(photo.id) ? 'Quitar selección' : 'Seleccionar'}
            >
              {favorites.has(photo.id) && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';

interface GalleryCardProps {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  eventType: string;
  eventDate: string;
  coverPhotoUrl?: string;
  photoCount?: number;
}

export default function GalleryCard({
  title,
  slug,
  categoryName,
  eventType,
  eventDate,
  coverPhotoUrl,
  photoCount = 0,
}: GalleryCardProps) {
  const formattedDate = new Date(eventDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link href={`/galerias/${slug}`} className="group block">
      {/* Imagen - sin border, sin sombra */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
        {coverPhotoUrl ? (
          <Image
            src={coverPhotoUrl}
            alt={title}
            fill
            className="object-cover hover-subtle"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg
              className="w-16 h-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Información debajo - minimalista */}
      <div className="space-y-2">
        {/* Título */}
        <h3 className="text-base font-medium text-gray-900 group-hover:text-devil-600 transition-colors duration-200 line-clamp-1">
          {title}
        </h3>

        {/* Metadata en una línea */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="capitalize">{eventType}</span>
          <span>•</span>
          <span>{photoCount} {photoCount === 1 ? 'foto' : 'fotos'}</span>
        </div>

        {/* Fecha */}
        <p className="text-sm text-gray-400">{formattedDate}</p>
      </div>
    </Link>
  );
}

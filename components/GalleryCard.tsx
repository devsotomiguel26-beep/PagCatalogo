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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Traducir tipo de evento
  const eventTypeLabels: Record<string, string> = {
    partido: 'Partido',
    torneo: 'Torneo',
    evento: 'Evento',
    entrenamiento: 'Entrenamiento',
  };

  return (
    <Link href={`/galerias/${slug}`} className="group block">
      {/* Imagen - Aspect ratio 16:9 con badge flotante */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden mb-4 rounded-lg">
        {coverPhotoUrl ? (
          <>
            <Image
              src={coverPhotoUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
            />
            {/* Badge de categoría flotante */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block bg-devil-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                {categoryName}
              </span>
            </div>

            {/* Overlay sutil en hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
          </>
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

      {/* Información debajo - Mejorada */}
      <div className="space-y-3">
        {/* Título - Más prominente */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-devil-600 transition-colors duration-200 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Metadata mejorada */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{photoCount} fotos</span>
          </div>
          <span className="text-gray-500 capitalize">{eventTypeLabels[eventType] || eventType}</span>
        </div>

        {/* Fecha - Más prominente */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <time dateTime={eventDate}>{formattedDate}</time>
        </div>
      </div>
    </Link>
  );
}

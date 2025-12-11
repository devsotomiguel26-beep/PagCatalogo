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
    <Link href={`/galerias/${slug}`}>
      <div className="group cursor-pointer bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-2 border border-gray-100">
        {/* Imagen de portada */}
        <div className="relative h-64 bg-gray-200 overflow-hidden">
          {coverPhotoUrl ? (
            <>
              <Image
                src={coverPhotoUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Floating badge */}
              <div className="absolute top-4 right-4 bg-devil-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
              <svg
                className="w-20 h-20 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-devil-600 transition-colors line-clamp-2">
            {title}
          </h3>

          <div className="space-y-3">
            {/* Categoría y tipo de evento */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-devil-50 text-devil-700 border border-devil-100">
                {categoryName}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                {eventType}
              </span>
            </div>

            {/* Fecha */}
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 text-devil-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">{formattedDate}</span>
            </div>

            {/* Ver galería link */}
            <div className="pt-2 flex items-center text-devil-600 font-semibold text-sm group-hover:gap-2 transition-all">
              <span>Ver galería</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GalleryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="h-56 bg-gray-200"></div>

      {/* Contenido skeleton */}
      <div className="p-4">
        {/* Título */}
        <div className="h-6 bg-gray-200 rounded mb-2"></div>

        {/* Badges */}
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </div>

        {/* Fecha */}
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>

        {/* Contador fotos */}
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

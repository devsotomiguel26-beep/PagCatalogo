import { ReactNode } from 'react';

interface GalleryGridProps {
  children: ReactNode;
}

export default function GalleryGrid({ children }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}

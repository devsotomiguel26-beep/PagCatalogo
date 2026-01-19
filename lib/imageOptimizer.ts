import sharp from 'sharp';

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimiza una imagen usando Sharp
 * @param buffer - Buffer de la imagen original
 * @param options - Opciones de optimización
 * @returns Buffer de la imagen optimizada
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 85,
    format = 'webp'
  } = options;

  let pipeline = sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .rotate(); // Auto-rotate based on EXIF

  // Convertir a formato optimizado
  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality: quality, compressionLevel: 9 });
  }

  return pipeline.toBuffer();
}

/**
 * Genera múltiples tamaños de una imagen (thumbnail, medium, large)
 * Útil para responsive images
 */
export async function generateResponsiveSizes(
  buffer: Buffer
): Promise<{
  thumbnail: Buffer;    // 400px - para grids
  medium: Buffer;       // 1200px - para lightbox mobile
  large: Buffer;        // 2000px - para lightbox desktop
}> {
  const [thumbnail, medium, large] = await Promise.all([
    optimizeImage(buffer, { maxWidth: 400, maxHeight: 400, quality: 80 }),
    optimizeImage(buffer, { maxWidth: 1200, maxHeight: 1200, quality: 85 }),
    optimizeImage(buffer, { maxWidth: 2000, maxHeight: 2000, quality: 85 })
  ]);

  return { thumbnail, medium, large };
}

/**
 * Calcula el tamaño de reducción de una imagen
 */
export async function getOptimizationStats(originalBuffer: Buffer, optimizedBuffer: Buffer) {
  const originalSize = originalBuffer.length;
  const optimizedSize = optimizedBuffer.length;
  const reduction = ((originalSize - optimizedSize) / originalSize) * 100;

  return {
    originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
    optimizedSize: `${(optimizedSize / 1024 / 1024).toFixed(2)} MB`,
    reduction: `${reduction.toFixed(1)}%`,
    savings: `${((originalSize - optimizedSize) / 1024 / 1024).toFixed(2)} MB`
  };
}

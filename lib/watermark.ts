import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface WatermarkOptions {
  opacity?: number; // 0-100
  position?: 'center' | 'bottom-right' | 'top-right';
  scale?: number; // 0-1, tamaño del logo relativo a la imagen
  format?: 'webp' | 'jpeg' | 'png'; // Formato de salida
  quality?: number; // Calidad de compresión (1-100)
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  opacity: 50,
  position: 'center',
  scale: 0.8, // Logo será 50% del ancho de la imagen
  format: 'webp',
  quality: 85,
};

/**
 * Agrega marca de agua (logo) a una imagen
 * @param inputBuffer Buffer de la imagen original
 * @param options Opciones de configuración de marca de agua
 * @param watermarkPath Path o URL de la marca de agua (opcional, usa local por defecto)
 * @returns Buffer de la imagen con marca de agua
 */
export async function addWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions = {},
  watermarkPath?: string
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Obtener metadata de la imagen original
    const imageMetadata = await sharp(inputBuffer).metadata();
    const imageWidth = imageMetadata.width || 1920;
    const imageHeight = imageMetadata.height || 1080;

    // Cargar logo desde URL (Supabase) o filesystem local
    let logoBuffer: Buffer;

    if (watermarkPath) {
      // Descargar marca de agua desde URL de Supabase
      console.log(`🔽 Descargando marca de agua desde: ${watermarkPath}`);
      const response = await fetch(watermarkPath);

      if (!response.ok) {
        throw new Error(`Error descargando marca de agua: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
      console.log('✅ Marca de agua descargada correctamente');
    } else {
      // Leer marca de agua local (fallback)
      const logoPath = path.join(process.cwd(), 'public', 'watermark', 'logo.png');

      if (!fs.existsSync(logoPath)) {
        throw new Error('Logo de marca de agua no encontrado en public/watermark/logo.png');
      }

      logoBuffer = fs.readFileSync(logoPath);
      console.log('📁 Usando marca de agua local');
    }

    // Calcular tamaño del logo
    const logoWidth = Math.floor(imageWidth * (opts.scale || 0.5));

    // Procesar logo: redimensionar y aplicar opacidad
    const watermarkBuffer = await sharp(logoBuffer)
      .resize(logoWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor((opts.opacity || 50) * 2.55)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    // Calcular posición
    let gravity: any = 'center';
    let left: number | undefined;
    let top: number | undefined;

    if (opts.position === 'center') {
      // Posición diagonal centro
      gravity = 'center';
    } else if (opts.position === 'bottom-right') {
      const watermarkMetadata = await sharp(watermarkBuffer).metadata();
      left = imageWidth - (watermarkMetadata.width || 0) - 20;
      top = imageHeight - (watermarkMetadata.height || 0) - 20;
    } else if (opts.position === 'top-right') {
      const watermarkMetadata = await sharp(watermarkBuffer).metadata();
      left = imageWidth - (watermarkMetadata.width || 0) - 20;
      top = 20;
    }

    // Aplicar marca de agua y convertir al formato deseado
    let pipeline = sharp(inputBuffer)
      .composite([
        {
          input: watermarkBuffer,
          gravity: left === undefined ? gravity : undefined,
          left,
          top,
        },
      ]);

    // Convertir al formato especificado
    const format = opts.format || 'webp';
    const quality = opts.quality || 85;

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    }

    const outputBuffer = await pipeline.toBuffer();
    return outputBuffer;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

/**
 * Procesa una imagen para el catálogo: agrega marca de agua
 * @param inputBuffer Buffer de la imagen (ya debe estar optimizada)
 * @param watermarkPath Path o URL de la marca de agua (opcional)
 * @param format Formato de salida (webp, jpeg, png)
 * @param quality Calidad de compresión (1-100)
 * @returns Buffer de la imagen con marca de agua
 */
export async function processForCatalog(
  inputBuffer: Buffer,
  watermarkPath?: string,
  format: 'webp' | 'jpeg' | 'png' = 'webp',
  quality: number = 85
): Promise<Buffer> {
  try {
    // Solo agregar marca de agua (la imagen ya viene optimizada)
    const watermarkedBuffer = await addWatermark(
      inputBuffer,
      {
        opacity: 50,
        position: 'center',
        scale: 0.8,
        format,
        quality,
      },
      watermarkPath
    );

    return watermarkedBuffer;
  } catch (error) {
    console.error('Error processing image for catalog:', error);
    throw error;
  }
}

/**
 * Optimiza imagen original para almacenamiento
 * (mantiene alta calidad pero reduce tamaño de archivo)
 */
export async function processOriginal(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .jpeg({ quality: 95 }) // Alta calidad
      .toBuffer();
  } catch (error) {
    console.error('Error processing original image:', error);
    throw error;
  }
}

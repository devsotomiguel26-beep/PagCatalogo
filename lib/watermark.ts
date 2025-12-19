import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface WatermarkOptions {
  opacity?: number; // 0-100
  position?: 'center' | 'bottom-right' | 'top-right';
  scale?: number; // 0-1, tamaño del logo relativo a la imagen
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  opacity: 50,
  position: 'center',
  scale: 0.8, // Logo será 50% del ancho de la imagen
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

    // Aplicar marca de agua
    const outputBuffer = await sharp(inputBuffer)
      .composite([
        {
          input: watermarkBuffer,
          gravity: left === undefined ? gravity : undefined,
          left,
          top,
        },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();

    return outputBuffer;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

/**
 * Procesa una imagen para el catálogo: optimiza y agrega marca de agua
 * @param inputBuffer Buffer de la imagen original
 * @param watermarkPath Path o URL de la marca de agua (opcional)
 * @returns Buffer de la imagen optimizada con marca de agua
 */
export async function processForCatalog(
  inputBuffer: Buffer,
  watermarkPath?: string
): Promise<Buffer> {
  try {
    // Primero optimizar tamaño para web (máximo 1920x1080)
    const resizedBuffer = await sharp(inputBuffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Luego agregar marca de agua
    const watermarkedBuffer = await addWatermark(
      resizedBuffer,
      {
        opacity: 50,
        position: 'center',
        scale: 0.8,
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

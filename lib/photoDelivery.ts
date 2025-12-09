import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DOWNLOAD_LINK_EXPIRY_DAYS = 7; // Links expiran en 7 días
const DOWNLOAD_LINK_EXPIRY_SECONDS = DOWNLOAD_LINK_EXPIRY_DAYS * 24 * 60 * 60;

export interface PhotoDownloadLink {
  photoId: string;
  url: string;
  expiresAt: Date;
}

/**
 * Genera links de descarga temporales para las fotos originales (sin marca de agua)
 * @param photoIds Array de IDs de fotos
 * @returns Array de objetos con photoId, url de descarga y fecha de expiración
 */
export async function generateDownloadLinks(
  photoIds: string[]
): Promise<PhotoDownloadLink[]> {
  try {
    // Obtener fotos de la base de datos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, original_path')
      .in('id', photoIds);

    if (photosError) {
      throw photosError;
    }

    if (!photos || photos.length === 0) {
      throw new Error('No se encontraron fotos');
    }

    // Generar signed URLs para cada foto
    const downloadLinks: PhotoDownloadLink[] = [];
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + DOWNLOAD_LINK_EXPIRY_SECONDS);

    for (const photo of photos) {
      if (!photo.original_path) {
        console.warn(`Foto ${photo.id} no tiene original_path, usando storage_path`);
        continue;
      }

      // Generar signed URL con Supabase
      const { data: urlData, error: urlError } = await supabase.storage
        .from('gallery-images')
        .createSignedUrl(photo.original_path, DOWNLOAD_LINK_EXPIRY_SECONDS);

      if (urlError) {
        console.error(`Error generando URL para foto ${photo.id}:`, urlError);
        continue;
      }

      if (!urlData.signedUrl) {
        console.error(`No se pudo generar URL para foto ${photo.id}`);
        continue;
      }

      downloadLinks.push({
        photoId: photo.id,
        url: urlData.signedUrl,
        expiresAt,
      });
    }

    return downloadLinks;
  } catch (error) {
    console.error('Error generating download links:', error);
    throw error;
  }
}

/**
 * Marca una solicitud como "fotos enviadas" y guarda la fecha de expiración
 * @param requestId ID de la solicitud
 * @param expiresAt Fecha de expiración de los links
 */
export async function markPhotosAsSent(
  requestId: string,
  expiresAt: Date
): Promise<void> {
  try {
    const { error } = await supabase
      .from('photo_requests')
      .update({
        photos_sent_at: new Date().toISOString(),
        download_links_expires_at: expiresAt.toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error marking photos as sent:', error);
    throw error;
  }
}

/**
 * Obtiene los datos completos de una solicitud para generar el email
 * @param requestId ID de la solicitud
 * @returns Datos de la solicitud con información de galería y fotos
 */
export async function getRequestForDelivery(requestId: string) {
  try {
    const { data, error } = await supabase
      .from('photo_requests')
      .select(`
        *,
        galleries (
          id,
          title,
          slug
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Solicitud no encontrada');
    }

    return data;
  } catch (error) {
    console.error('Error getting request for delivery:', error);
    throw error;
  }
}

/**
 * Calcula el monto total de una solicitud
 * @param photoCount Cantidad de fotos
 * @param pricePerPhoto Precio por foto (default: $2000 CLP)
 * @returns Monto total
 */
export function calculateAmount(photoCount: number, pricePerPhoto: number = 2000): number {
  return photoCount * pricePerPhoto;
}

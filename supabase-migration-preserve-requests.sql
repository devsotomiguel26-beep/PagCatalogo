-- Migración: Preservar Historial de Solicitudes al Eliminar Galerías
-- Fecha: 2025-12-17
-- Descripción: Permite eliminar galerías antiguas manteniendo el historial de solicitudes

-- 1. Agregar campos a photo_requests para preservar información de la galería
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS gallery_title TEXT,
ADD COLUMN IF NOT EXISTS gallery_event_date DATE,
ADD COLUMN IF NOT EXISTS gallery_event_type TEXT,
ADD COLUMN IF NOT EXISTS gallery_slug TEXT;

-- 2. Hacer gallery_id nullable (para solicitudes de galerías eliminadas)
ALTER TABLE photo_requests
ALTER COLUMN gallery_id DROP NOT NULL;

-- 3. Copiar datos existentes de galleries a photo_requests
UPDATE photo_requests pr
SET
  gallery_title = g.title,
  gallery_event_date = g.event_date,
  gallery_event_type = g.event_type,
  gallery_slug = g.slug
FROM galleries g
WHERE pr.gallery_id = g.id
  AND pr.gallery_title IS NULL;

-- 4. Agregar comentarios explicativos
COMMENT ON COLUMN photo_requests.gallery_title IS 'Título de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_date IS 'Fecha del evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_type IS 'Tipo de evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_slug IS 'Slug de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_id IS 'ID de galería (NULL si la galería fue eliminada)';

-- Verificación
-- Ejecuta esto después de la migración para verificar:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'photo_requests'
--   AND column_name IN ('gallery_title', 'gallery_event_date', 'gallery_event_type', 'gallery_slug', 'gallery_id');

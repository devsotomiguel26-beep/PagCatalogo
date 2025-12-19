-- Migración simplificada - Ejecutar TODO de una vez en SQL Editor

-- 1. Agregar columnas nuevas
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS gallery_title TEXT,
ADD COLUMN IF NOT EXISTS gallery_event_date DATE,
ADD COLUMN IF NOT EXISTS gallery_event_type TEXT,
ADD COLUMN IF NOT EXISTS gallery_slug TEXT;

-- 2. Copiar datos existentes
UPDATE photo_requests pr
SET
  gallery_title = g.title,
  gallery_event_date = g.event_date,
  gallery_event_type = g.event_type,
  gallery_slug = g.slug
FROM galleries g
WHERE pr.gallery_id = g.id
  AND pr.gallery_title IS NULL;

-- 3. Hacer gallery_id nullable
ALTER TABLE photo_requests
ALTER COLUMN gallery_id DROP NOT NULL;

-- 4. Eliminar constraint antigua (si existe)
ALTER TABLE photo_requests DROP CONSTRAINT IF EXISTS photo_requests_gallery_id_fkey;

-- 5. Crear nueva constraint con ON DELETE SET NULL
ALTER TABLE photo_requests
ADD CONSTRAINT photo_requests_gallery_id_fkey
FOREIGN KEY (gallery_id)
REFERENCES galleries(id)
ON DELETE SET NULL;

-- 6. Agregar comentarios
COMMENT ON COLUMN photo_requests.gallery_title IS 'Título de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_date IS 'Fecha del evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_type IS 'Tipo de evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_slug IS 'Slug de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_id IS 'ID de galería (NULL si la galería fue eliminada)';

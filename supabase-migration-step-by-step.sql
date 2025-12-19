-- Migración paso por paso (ejecutar cada sección por separado)
-- Copia y ejecuta cada bloque UNO POR UNO en el SQL Editor de Supabase

-- ====================================================================
-- PASO 1: Agregar columnas nuevas
-- ====================================================================
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS gallery_title TEXT,
ADD COLUMN IF NOT EXISTS gallery_event_date DATE,
ADD COLUMN IF NOT EXISTS gallery_event_type TEXT,
ADD COLUMN IF NOT EXISTS gallery_slug TEXT;

-- ====================================================================
-- PASO 2: Copiar datos existentes
-- ====================================================================
UPDATE photo_requests pr
SET
  gallery_title = g.title,
  gallery_event_date = g.event_date,
  gallery_event_type = g.event_type,
  gallery_slug = g.slug
FROM galleries g
WHERE pr.gallery_id = g.id
  AND pr.gallery_title IS NULL;

-- ====================================================================
-- PASO 3: Hacer gallery_id nullable
-- ====================================================================
ALTER TABLE photo_requests
ALTER COLUMN gallery_id DROP NOT NULL;

-- ====================================================================
-- PASO 4: Eliminar constraint antigua
-- ====================================================================
-- Ejecuta esta query primero para ver el nombre de la constraint:
SELECT con.conname AS constraint_name
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'photo_requests'
  AND con.contype = 'f'
  AND con.confrelid = (SELECT oid FROM pg_class WHERE relname = 'galleries');

-- Luego ejecuta esto, reemplazando 'NOMBRE_CONSTRAINT' con el resultado de arriba:
-- ALTER TABLE photo_requests DROP CONSTRAINT NOMBRE_CONSTRAINT;

-- Si el nombre es 'photo_requests_gallery_id_fkey', ejecuta esto:
ALTER TABLE photo_requests DROP CONSTRAINT IF EXISTS photo_requests_gallery_id_fkey;

-- ====================================================================
-- PASO 5: Crear nueva constraint con ON DELETE SET NULL
-- ====================================================================
ALTER TABLE photo_requests
ADD CONSTRAINT photo_requests_gallery_id_fkey
FOREIGN KEY (gallery_id)
REFERENCES galleries(id)
ON DELETE SET NULL;

-- ====================================================================
-- PASO 6: Agregar comentarios
-- ====================================================================
COMMENT ON COLUMN photo_requests.gallery_title IS 'Título de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_date IS 'Fecha del evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_type IS 'Tipo de evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_slug IS 'Slug de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_id IS 'ID de galería (NULL si la galería fue eliminada)';

-- ====================================================================
-- PASO 7: Verificación final
-- ====================================================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'photo_requests'
  AND column_name IN ('gallery_id', 'gallery_title', 'gallery_event_date', 'gallery_event_type', 'gallery_slug')
ORDER BY column_name;

-- Ver la constraint actualizada:
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'photo_requests'
  AND con.contype = 'f';

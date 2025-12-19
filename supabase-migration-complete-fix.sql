-- Migración completa: Permitir eliminar galerías preservando historial
-- Ejecutar TODO este script en el SQL Editor de Supabase

-- ====================================================================
-- PASO 1: Agregar columnas nuevas si no existen
-- ====================================================================
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS gallery_title TEXT,
ADD COLUMN IF NOT EXISTS gallery_event_date DATE,
ADD COLUMN IF NOT EXISTS gallery_event_type TEXT,
ADD COLUMN IF NOT EXISTS gallery_slug TEXT;

-- ====================================================================
-- PASO 2: Copiar datos existentes a las columnas nuevas
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
-- PASO 3: Modificar la foreign key constraint
-- ====================================================================
-- Primero, encontrar el nombre de la constraint actual
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la constraint
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'photo_requests'
    AND con.contype = 'f'
    AND con.confrelid = (SELECT oid FROM pg_class WHERE relname = 'galleries');

  -- Si existe, eliminarla
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE photo_requests DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Constraint % eliminada', constraint_name;
  END IF;
END $$;

-- Hacer gallery_id nullable
ALTER TABLE photo_requests
ALTER COLUMN gallery_id DROP NOT NULL;

-- Crear nueva foreign key constraint con ON DELETE SET NULL
ALTER TABLE photo_requests
ADD CONSTRAINT photo_requests_gallery_id_fkey
FOREIGN KEY (gallery_id)
REFERENCES galleries(id)
ON DELETE SET NULL;  -- Esto permite que al eliminar una galería, gallery_id se ponga en NULL

-- ====================================================================
-- PASO 4: Agregar comentarios explicativos
-- ====================================================================
COMMENT ON COLUMN photo_requests.gallery_title IS 'Título de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_date IS 'Fecha del evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_event_type IS 'Tipo de evento (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_slug IS 'Slug de la galería (preservado para historial)';
COMMENT ON COLUMN photo_requests.gallery_id IS 'ID de galería (NULL si la galería fue eliminada)';

-- ====================================================================
-- Verificación
-- ====================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'photo_requests'
  AND column_name IN ('gallery_id', 'gallery_title', 'gallery_event_date', 'gallery_event_type', 'gallery_slug')
ORDER BY column_name;

-- Ver la constraint actualizada
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'photo_requests'
  AND con.contype = 'f';

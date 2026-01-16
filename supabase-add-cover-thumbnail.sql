-- Agregar columna para thumbnail de portada SIN marca de agua
-- Esta URL apuntará a una versión pequeña (400x400px) sin watermark
-- Solo se genera cuando se establece una foto como portada

ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS cover_thumbnail_url TEXT;

-- Comentario en la columna para documentación
COMMENT ON COLUMN galleries.cover_thumbnail_url IS 'URL del thumbnail de portada SIN marca de agua (400x400px). Se genera al establecer cover_photo_id.';

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'galleries'
AND column_name IN ('cover_photo_id', 'cover_thumbnail_url');

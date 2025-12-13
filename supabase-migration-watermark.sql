-- Migración: Agregar soporte para marcas de agua
-- Fecha: 2025-12-13
-- Descripción: Agrega campo original_path para almacenar fotos sin marca de agua

-- 1. Agregar columna original_path a la tabla photos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS original_path TEXT;

-- 2. Comentarios explicativos
COMMENT ON COLUMN photos.storage_path IS 'Path de la foto CON marca de agua (mostrada en galería pública)';
COMMENT ON COLUMN photos.original_path IS 'Path de la foto SIN marca de agua (enviada post-compra)';
COMMENT ON COLUMN photos.public_url IS 'URL pública de la foto CON marca de agua';

-- 3. Para fotos existentes (sin original_path), copiar storage_path como fallback
-- SOLO ejecutar si tienes fotos existentes sin marca de agua
-- UPDATE photos
-- SET original_path = storage_path
-- WHERE original_path IS NULL;

-- Verificación
SELECT
  COUNT(*) as total_fotos,
  COUNT(original_path) as con_original,
  COUNT(*) - COUNT(original_path) as sin_original
FROM photos;

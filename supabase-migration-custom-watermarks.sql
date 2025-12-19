-- Migración: Sistema Híbrido de Marcas de Agua
-- Fecha: 2025-12-17
-- Descripción: Agregar soporte para marcas de agua personalizadas por galería

-- Agregar campo para marca de agua personalizada
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS watermark_path TEXT;

-- Comentario explicativo
COMMENT ON COLUMN galleries.watermark_path IS 'Path en Supabase Storage de marca de agua personalizada (opcional). Si es NULL, usa la marca de agua global.';

-- Verificación
-- Ejecuta esto después de la migración para verificar:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'galleries'
--   AND column_name = 'watermark_path';

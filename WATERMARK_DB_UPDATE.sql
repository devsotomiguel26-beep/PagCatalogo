-- ============================================================
-- ACTUALIZACIÓN DE BASE DE DATOS PARA SISTEMA DE MARCA DE AGUA
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Autor: Sistema Diablos Rojos Foto
-- Fecha: 2025-12-06
-- ============================================================

-- 1. Agregar campo para ruta de foto original en tabla photos
-- ============================================================
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS original_path TEXT;

COMMENT ON COLUMN photos.original_path IS 'Ruta a la versión original sin marca de agua (privada)';

-- 2. Actualizar tabla photo_requests con campos para gestión de pagos y entrega
-- ============================================================

-- Campo para método de pago
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'transfer';

COMMENT ON COLUMN photo_requests.payment_method IS 'Método de pago: transfer, online, cash';

-- Campo para monto total
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

COMMENT ON COLUMN photo_requests.amount IS 'Monto total a pagar (ej: 10000 = 10 fotos x $2000)';

-- Campo para ID de transacción (para futuras pasarelas de pago)
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);

COMMENT ON COLUMN photo_requests.payment_id IS 'ID de transacción de pasarela de pago (MercadoPago, Flow, etc)';

-- Campo para estado de pago
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

COMMENT ON COLUMN photo_requests.payment_status IS 'Estado de pago: pending, processing, completed, failed';

-- Campo para fecha de envío de fotos
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS photos_sent_at TIMESTAMP;

COMMENT ON COLUMN photo_requests.photos_sent_at IS 'Fecha y hora en que se enviaron las fotos al cliente';

-- Campo para expiración de links de descarga
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS download_links_expires_at TIMESTAMP;

COMMENT ON COLUMN photo_requests.download_links_expires_at IS 'Fecha de expiración de los links de descarga';

-- Campo para número de teléfono del cliente (ya debería existir, pero por si acaso)
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);

COMMENT ON COLUMN photo_requests.client_phone IS 'Teléfono de contacto del cliente';

-- 3. Crear índices para mejorar rendimiento
-- ============================================================

-- Índice para buscar fotos originales rápidamente
CREATE INDEX IF NOT EXISTS idx_photos_original_path ON photos(original_path);

-- Índice para buscar solicitudes por estado de pago
CREATE INDEX IF NOT EXISTS idx_photo_requests_payment_status ON photo_requests(payment_status);

-- Índice para buscar solicitudes por método de pago
CREATE INDEX IF NOT EXISTS idx_photo_requests_payment_method ON photo_requests(payment_method);

-- Índice para buscar solicitudes con fotos enviadas
CREATE INDEX IF NOT EXISTS idx_photo_requests_photos_sent ON photo_requests(photos_sent_at);

-- 4. Actualizar registros existentes
-- ============================================================

-- Actualizar solicitudes existentes con valores por defecto
UPDATE photo_requests
SET
  payment_method = 'transfer',
  payment_status = CASE
    WHEN status = 'paid' THEN 'completed'
    WHEN status = 'delivered' THEN 'completed'
    ELSE 'pending'
  END
WHERE payment_method IS NULL OR payment_status IS NULL;

-- 5. Configurar RLS (Row Level Security) para carpetas de storage
-- ============================================================
-- NOTA: Las políticas de storage se configuran en Supabase Dashboard → Storage → Policies

-- Para ejecutar manualmente en Storage Policies:
--
-- Política para carpeta /original/ (SOLO ADMIN):
-- Nombre: admin_only_original
-- Target: SELECT
-- Policy: bucket_id = 'gallery-images' AND storage.foldername(name)[1] = 'original' AND auth.uid() IS NOT NULL
--
-- Política para carpeta /watermarked/ (PÚBLICO):
-- Nombre: public_watermarked
-- Target: SELECT
-- Policy: bucket_id = 'gallery-images' AND storage.foldername(name)[1] = 'watermarked'

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar que los campos se agregaron correctamente
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'photo_requests'
  AND column_name IN (
    'payment_method',
    'amount',
    'payment_id',
    'payment_status',
    'photos_sent_at',
    'download_links_expires_at',
    'client_phone'
  )
ORDER BY column_name;

-- Verificar campo en photos
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'photos'
  AND column_name = 'original_path';

-- Verificar índices creados
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('photos', 'photo_requests')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================
-- ¡LISTO!
-- ============================================================
-- Una vez ejecutado este script, la base de datos estará lista
-- para el sistema de marca de agua y gestión de pagos.
-- ============================================================

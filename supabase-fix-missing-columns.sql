-- ============================================================================
-- Migración: Agregar columnas faltantes para sistema de pagos
-- ============================================================================
-- Agrega flow_order que falta y verifica payment_data
-- ============================================================================

-- 1. Agregar columna flow_order si no existe
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS flow_order BIGINT;

COMMENT ON COLUMN photo_requests.flow_order IS 'Número de orden de Flow para tracking de pago';

-- 2. Agregar columna payment_date si no existe
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

COMMENT ON COLUMN photo_requests.payment_date IS 'Fecha en que se confirmó el pago';

-- 3. Verificar que payment_data existe (debería existir ya)
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_data JSONB;

COMMENT ON COLUMN photo_requests.payment_data IS 'Datos completos del pago desde Flow API';

-- 4. Crear índice para flow_order (ahora sí debería funcionar)
CREATE INDEX IF NOT EXISTS idx_photo_requests_flow_order ON photo_requests(flow_order);

-- 5. Crear índice para payment_date
CREATE INDEX IF NOT EXISTS idx_photo_requests_payment_date ON photo_requests(payment_date);

-- 6. Vista para acceso rápido a detalles de pagos
CREATE OR REPLACE VIEW payment_details_view AS
SELECT
  pr.id as request_id,
  pr.client_name,
  pr.client_email,
  pr.status,
  pr.flow_order,
  pr.payment_date,
  pr.payment_data,
  g.title as gallery_title,
  ARRAY_LENGTH(pr.photo_ids, 1) as photo_count,
  (pr.transaction_details->>'gross_amount')::numeric as amount_paid,
  (pr.payment_data->>'paymentType')::text as payment_type,
  (pr.payment_data->'paymentData'->>'media')::text as payment_media,
  (pr.payment_data->'paymentData'->>'date')::text as payment_date_flow,
  (pr.payment_data->>'status')::text as payment_status
FROM photo_requests pr
LEFT JOIN galleries g ON g.id = pr.gallery_id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.flow_order IS NOT NULL
ORDER BY pr.payment_date DESC;

COMMENT ON VIEW payment_details_view IS 'Vista para mostrar detalles de pagos con información de Flow';

-- 7. Verificar que todo existe ahora
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'photo_requests'
  AND column_name IN ('flow_order', 'payment_date', 'payment_data', 'transaction_details', 'settlement_status')
ORDER BY column_name;

-- 8. Ver estadísticas
SELECT
  COUNT(*) as total_paid_requests,
  COUNT(flow_order) as with_flow_order,
  COUNT(payment_data) as with_payment_data,
  COUNT(payment_date) as with_payment_date
FROM photo_requests
WHERE status IN ('paid', 'delivered', 'expired');

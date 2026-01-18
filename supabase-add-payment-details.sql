-- ============================================================================
-- Migración: Agregar detalles completos del pago de Flow
-- ============================================================================
-- Permite guardar toda la información del pago para mostrar comprobantes
-- ============================================================================

-- Agregar columna para guardar el payload completo de Flow
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS payment_data JSONB;

COMMENT ON COLUMN photo_requests.payment_data IS 'Datos completos del pago desde Flow API: {flowOrder, amount, status, paymentData, payer, date, etc}. Usado para mostrar comprobantes y detalles del pago.';

-- Crear índice para búsquedas por flow_order
CREATE INDEX IF NOT EXISTS idx_photo_requests_flow_order ON photo_requests(flow_order);

-- Vista para acceso rápido a detalles de pagos
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

-- Verificar datos existentes
SELECT
  COUNT(*) as total_paid_requests,
  COUNT(flow_order) as with_flow_order,
  COUNT(payment_data) as with_payment_data
FROM photo_requests
WHERE status IN ('paid', 'delivered', 'expired');

-- Ver ejemplo de payment_data (si existe)
SELECT
  id,
  client_name,
  flow_order,
  payment_data
FROM photo_requests
WHERE payment_data IS NOT NULL
LIMIT 1;

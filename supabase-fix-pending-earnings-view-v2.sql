-- ============================================================================
-- FIX FINAL: Vista pending_earnings que soporta AMBAS estructuras
-- ============================================================================
-- PROBLEMA: Hay dos estructuras diferentes de transaction_details:
--
-- ESTRUCTURA NUEVA (desde webhook Flow):
-- {
--   "photographer_share": 15490,
--   "director_share": 3872
-- }
--
-- ESTRUCTURA ANTIGUA (desde migración):
-- {
--   "breakdown": {
--     "photographer_share": 4632,
--     "director_share": 1158
--   }
-- }
--
-- SOLUCIÓN: Usar COALESCE para intentar ambas rutas
-- ============================================================================

-- Eliminar vista existente
DROP VIEW IF EXISTS pending_earnings CASCADE;

-- Recrear vista que soporta AMBAS estructuras
CREATE OR REPLACE VIEW pending_earnings AS
SELECT
  pr.id as request_id,
  g.id as gallery_id,
  g.title as gallery_title,
  g.slug as gallery_slug,
  p.id as photographer_id,
  p.name as photographer_name,
  pr.client_name,
  pr.client_email,
  pr.status as request_status,
  pr.settlement_status,
  pr.created_at as request_date,
  ARRAY_LENGTH(pr.photo_ids, 1) as photo_count,
  pr.price_per_photo,
  (pr.transaction_details->>'gross_amount')::numeric as gross_amount,
  (pr.transaction_details->>'gateway_fee')::numeric as gateway_fee,
  (pr.transaction_details->>'net_amount')::numeric as net_amount,
  -- SOPORTA AMBAS ESTRUCTURAS: intenta nivel superior primero, luego breakdown
  COALESCE(
    (pr.transaction_details->>'photographer_share')::numeric,
    (pr.transaction_details->'breakdown'->>'photographer_share')::numeric
  ) as photographer_share,
  COALESCE(
    (pr.transaction_details->>'director_share')::numeric,
    (pr.transaction_details->'breakdown'->>'director_share')::numeric
  ) as director_share,
  COALESCE(
    (pr.transaction_details->>'photographer_percentage')::numeric,
    (pr.transaction_details->'breakdown'->>'photographer_percentage')::numeric
  ) as photographer_pct,
  COALESCE(
    (pr.transaction_details->>'director_percentage')::numeric,
    (pr.transaction_details->'breakdown'->>'director_percentage')::numeric
  ) as director_pct
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.settlement_status != 'settled'
  AND pr.transaction_details IS NOT NULL
ORDER BY pr.created_at DESC;

COMMENT ON VIEW pending_earnings IS 'Ganancias pendientes - soporta estructuras nueva y antigua (2026-01-19 v2)';

-- ============================================================================
-- Verificación
-- ============================================================================
-- Ejecutar esto después del fix para verificar que ambas funcionan:
--
-- SELECT
--   client_name,
--   photo_count,
--   gross_amount,
--   photographer_share,
--   director_share
-- FROM pending_earnings
-- WHERE client_name ILIKE '%camila%' OR client_name ILIKE '%franco%'
-- ORDER BY client_name;
--
-- Debe mostrar:
-- Camila romero | 10 | 20000 | 15490 | 3872
-- Franco illino | 3  | 6000  | 4632  | 1158
-- ============================================================================

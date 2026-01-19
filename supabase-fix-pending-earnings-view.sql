-- ============================================================================
-- FIX CRÍTICO: Corregir vista pending_earnings
-- ============================================================================
-- PROBLEMA: La vista estaba leyendo photographer_share y director_share
-- desde transaction_details->'breakdown' pero la estructura real es
-- transaction_details->>'photographer_share' (directamente en el nivel superior)
--
-- SÍNTOMA: Liquidaciones mostraban $0 para solicitudes con transaction_details válidos
-- ============================================================================

-- Eliminar vista existente
DROP VIEW IF EXISTS pending_earnings CASCADE;

-- Recrear vista con estructura correcta
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
  -- CORRECCIÓN: Leer directamente del nivel superior del JSON
  (pr.transaction_details->>'photographer_share')::numeric as photographer_share,
  (pr.transaction_details->>'director_share')::numeric as director_share,
  (pr.transaction_details->>'photographer_percentage')::numeric as photographer_pct,
  (pr.transaction_details->>'director_percentage')::numeric as director_pct
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.settlement_status != 'settled'
  AND pr.transaction_details IS NOT NULL
ORDER BY pr.created_at DESC;

COMMENT ON VIEW pending_earnings IS 'Ganancias pendientes de pago a fotógrafos y director (CORREGIDA - 2026-01-19)';

-- ============================================================================
-- Verificación
-- ============================================================================
-- Ejecutar esto después del fix para verificar que funciona:
--
-- SELECT
--   client_name,
--   photo_count,
--   gross_amount,
--   photographer_share,
--   director_share
-- FROM pending_earnings
-- WHERE client_name ILIKE '%camila%romero%';
--
-- Debe mostrar:
-- Camila romero | 10 | 20000 | 15490 | 3872
-- ============================================================================

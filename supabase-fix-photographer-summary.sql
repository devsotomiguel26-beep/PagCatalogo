-- ============================================================================
-- FIX: photographer_earnings_summary - Incluir TODOS los fotógrafos
-- ============================================================================
-- PROBLEMA: La vista solo muestra fotógrafos con solicitudes que cumplen filtros
-- SOLUCIÓN: Cambiar filtros del WHERE al JOIN para incluir todos los fotógrafos
-- ============================================================================

DROP VIEW IF EXISTS photographer_earnings_summary CASCADE;

CREATE OR REPLACE VIEW photographer_earnings_summary AS
SELECT
  p.id as photographer_id,
  p.name as photographer_name,
  p.email as photographer_email,
  p.active,
  COUNT(DISTINCT pr.id) as total_requests,
  COALESCE(SUM(ARRAY_LENGTH(pr.photo_ids, 1)), 0) as total_photos,
  COALESCE(SUM(
    COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
  ), 0) as total_earnings,
  COALESCE(SUM(
    CASE WHEN pr.settlement_status = 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
    ELSE 0 END
  ), 0) as paid_amount,
  COALESCE(SUM(
    CASE WHEN pr.settlement_status != 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
    ELSE 0 END
  ), 0) as pending_amount,
  MIN(pr.created_at) as first_request_date,
  MAX(pr.created_at) as last_request_date
FROM photographers p
LEFT JOIN galleries g ON g.photographer_id = p.id
LEFT JOIN photo_requests pr ON pr.gallery_id = g.id
  AND pr.status IN ('paid', 'delivered', 'expired')
  AND pr.transaction_details IS NOT NULL
  AND COALESCE(pr.is_test, false) = false
GROUP BY p.id, p.name, p.email, p.active
ORDER BY pending_amount DESC NULLS LAST;

COMMENT ON VIEW photographer_earnings_summary IS 'Resumen de ganancias por fotógrafo - incluye todos los fotógrafos incluso sin solicitudes';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esto para verificar que funcionó:
--
-- SELECT * FROM photographer_earnings_summary;
--
-- ✅ Resultado esperado:
-- - Debe mostrar TODOS los fotógrafos activos e inactivos
-- - Fotógrafos sin solicitudes tendrán valores en 0
-- - Fotógrafos con solicitudes mostrarán sus totales correctos
-- ============================================================================

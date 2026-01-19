-- ============================================================================
-- FIX V5 DEFINITIVO: Convertir created_at a timestamp WITH time zone
-- ============================================================================
-- PROBLEMA: El campo created_at es 'timestamp without time zone'
-- CAUSA: Múltiples intentos fallaron porque aparecían nuevas vistas cada vez
--
-- TODAS LAS VISTAS DEL SISTEMA (7 en total):
--   1. active_requests - Solicitudes activas/productivas
--   2. pending_earnings - Ganancias pendientes
--   3. photographer_earnings_summary - Resumen por fotógrafo
--   4. director_earnings_summary - Resumen director
--   5. settlements_detail - Detalle liquidaciones
--   6. adjustments_history - Historial ajustes
--   7. production_requests - Solo solicitudes reales (NO test)
--
-- SOLUCIÓN: DROP CASCADE de todas, alterar columna, recrear todas
-- ============================================================================

-- ============================================================================
-- PASO 1: Eliminar TODAS las vistas del sistema (CASCADE elimina dependencias)
-- ============================================================================

DROP VIEW IF EXISTS active_requests CASCADE;
DROP VIEW IF EXISTS pending_earnings CASCADE;
DROP VIEW IF EXISTS photographer_earnings_summary CASCADE;
DROP VIEW IF EXISTS director_earnings_summary CASCADE;
DROP VIEW IF EXISTS settlements_detail CASCADE;
DROP VIEW IF EXISTS adjustments_history CASCADE;
DROP VIEW IF EXISTS production_requests CASCADE;

-- ============================================================================
-- PASO 2: Convertir todas las columnas timestamp a timestamptz
-- ============================================================================

-- Columna principal: created_at
ALTER TABLE photo_requests
ALTER COLUMN created_at TYPE timestamptz
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE photo_requests
ALTER COLUMN created_at SET DEFAULT NOW();

-- Otras columnas timestamp en photo_requests
ALTER TABLE photo_requests
ALTER COLUMN photos_sent_at TYPE timestamptz
USING CASE
  WHEN photos_sent_at IS NULL THEN NULL
  ELSE photos_sent_at AT TIME ZONE 'UTC'
END;

ALTER TABLE photo_requests
ALTER COLUMN download_links_expires_at TYPE timestamptz
USING CASE
  WHEN download_links_expires_at IS NULL THEN NULL
  ELSE download_links_expires_at AT TIME ZONE 'UTC'
END;

ALTER TABLE photo_requests
ALTER COLUMN payment_date TYPE timestamptz
USING CASE
  WHEN payment_date IS NULL THEN NULL
  ELSE payment_date AT TIME ZONE 'UTC'
END;

ALTER TABLE photo_requests
ALTER COLUMN cancelled_at TYPE timestamptz
USING CASE
  WHEN cancelled_at IS NULL THEN NULL
  ELSE cancelled_at AT TIME ZONE 'UTC'
END;

-- ============================================================================
-- PASO 3: Recrear TODAS las vistas (7 en total)
-- ============================================================================

-- Vista 1: active_requests
-- Filtra solicitudes productivas (no test, no archivadas, no canceladas)
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE (is_archived IS NOT TRUE OR is_archived IS NULL)
  AND (is_test IS NOT TRUE OR is_test IS NULL)
  AND status NOT IN ('cancelled', 'abandoned');

COMMENT ON VIEW active_requests IS 'Solicitudes activas/productivas (excluye test, archivadas, canceladas)';

-- Vista 2: production_requests
-- Solo solicitudes reales (excluye pruebas)
CREATE OR REPLACE VIEW production_requests AS
SELECT *
FROM photo_requests
WHERE COALESCE(is_test, false) = false
ORDER BY created_at DESC;

COMMENT ON VIEW production_requests IS 'Solo solicitudes reales (excluye pruebas)';

-- Vista 3: pending_earnings
-- Ganancias pendientes de liquidar (soporta ambas estructuras JSON)
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

COMMENT ON VIEW pending_earnings IS 'Ganancias pendientes - soporta estructuras nueva y antigua (2026-01-19 v5)';

-- Vista 4: photographer_earnings_summary
-- Resumen de ganancias por fotógrafo (soporta ambas estructuras JSON)
CREATE OR REPLACE VIEW photographer_earnings_summary AS
SELECT
  p.id as photographer_id,
  p.name as photographer_name,
  p.email as photographer_email,
  p.active,
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
  -- Soporta ambas estructuras con COALESCE
  SUM(
    COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
  ) as total_earnings,
  SUM(
    CASE WHEN pr.settlement_status = 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
    ELSE 0 END
  ) as paid_amount,
  SUM(
    CASE WHEN pr.settlement_status != 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'photographer_share')::numeric,
      (pr.transaction_details->'breakdown'->>'photographer_share')::numeric,
      0
    )
    ELSE 0 END
  ) as pending_amount,
  MIN(pr.created_at) as first_request_date,
  MAX(pr.created_at) as last_request_date
FROM photographers p
LEFT JOIN galleries g ON g.photographer_id = p.id
LEFT JOIN photo_requests pr ON pr.gallery_id = g.id
  AND pr.status IN ('paid', 'delivered', 'expired')
  AND pr.transaction_details IS NOT NULL
GROUP BY p.id, p.name, p.email, p.active
ORDER BY pending_amount DESC NULLS LAST;

COMMENT ON VIEW photographer_earnings_summary IS 'Resumen de ganancias por fotógrafo (v5 soporta ambas estructuras JSON)';

-- Vista 5: director_earnings_summary
-- Resumen de ganancias totales del director (soporta ambas estructuras JSON)
CREATE OR REPLACE VIEW director_earnings_summary AS
SELECT
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
  -- Soporta ambas estructuras con COALESCE
  SUM(
    COALESCE(
      (pr.transaction_details->>'director_share')::numeric,
      (pr.transaction_details->'breakdown'->>'director_share')::numeric,
      0
    )
  ) as total_earnings,
  SUM(
    CASE WHEN pr.settlement_status = 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'director_share')::numeric,
      (pr.transaction_details->'breakdown'->>'director_share')::numeric,
      0
    )
    ELSE 0 END
  ) as paid_amount,
  SUM(
    CASE WHEN pr.settlement_status != 'settled'
    THEN COALESCE(
      (pr.transaction_details->>'director_share')::numeric,
      (pr.transaction_details->'breakdown'->>'director_share')::numeric,
      0
    )
    ELSE 0 END
  ) as pending_amount,
  MIN(pr.created_at) as first_request_date,
  MAX(pr.created_at) as last_request_date
FROM photo_requests pr
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.transaction_details IS NOT NULL;

COMMENT ON VIEW director_earnings_summary IS 'Resumen de ganancias totales del director (v5 soporta ambas estructuras JSON)';

-- Vista 6: settlements_detail
-- Detalle completo de todas las liquidaciones realizadas
CREATE OR REPLACE VIEW settlements_detail AS
SELECT
  s.id as settlement_id,
  s.settlement_date,
  s.period_start,
  s.period_end,
  s.recipient_type,
  s.recipient_id,
  s.recipient_name,
  s.total_amount,
  ARRAY_LENGTH(s.photo_request_ids, 1) as requests_count,
  s.payment_method,
  s.payment_proof_url,
  s.status,
  s.notes,
  s.created_by,
  s.created_at,
  -- Calcular total de fotos en esta liquidación
  (
    SELECT SUM(ARRAY_LENGTH(pr.photo_ids, 1))
    FROM photo_requests pr
    WHERE pr.id = ANY(s.photo_request_ids)
  ) as total_photos
FROM settlements s
ORDER BY s.settlement_date DESC, s.created_at DESC;

COMMENT ON VIEW settlements_detail IS 'Detalle completo de todas las liquidaciones realizadas';

-- Vista 7: adjustments_history
-- Historial completo de ajustes manuales realizados
CREATE OR REPLACE VIEW adjustments_history AS
SELECT
  a.id as adjustment_id,
  a.photo_request_id,
  pr.client_name,
  g.title as gallery_title,
  a.adjustment_type,
  a.amount,
  a.affects_photographer,
  a.affects_director,
  a.reason,
  a.created_by,
  a.created_at
FROM adjustments a
JOIN photo_requests pr ON pr.id = a.photo_request_id
JOIN galleries g ON g.id = pr.gallery_id
ORDER BY a.created_at DESC;

COMMENT ON VIEW adjustments_history IS 'Historial completo de ajustes manuales realizados';

-- ============================================================================
-- PASO 4: Comentarios en la tabla
-- ============================================================================

COMMENT ON COLUMN photo_requests.created_at IS 'Timestamp with timezone - almacenado en UTC, convertido 2026-01-19 v5 para corregir bug de timezone';

-- ============================================================================
-- VERIFICACIÓN COMPLETA
-- ============================================================================
-- Ejecutar estas queries después del cambio para verificar:
--
-- 1. Verificar tipo de columna (debe ser timestamptz):
-- SELECT
--   column_name,
--   data_type,
--   datetime_precision
-- FROM information_schema.columns
-- WHERE table_name = 'photo_requests'
--   AND (column_name LIKE '%_at' OR column_name LIKE '%date%');
--
-- 2. Verificar datos de Hugo Cerda (debe mostrar hora correcta de Chile):
-- SELECT
--   client_name,
--   created_at,
--   created_at AT TIME ZONE 'America/Santiago' as created_at_chile,
--   pg_typeof(created_at) as column_type
-- FROM photo_requests
-- WHERE client_name ILIKE '%hugo%cerda%';
--
-- Resultado esperado:
-- - column_type: 'timestamp with time zone'
-- - created_at: debe incluir '+00' (ej: 2026-01-19T19:06:37.217338+00)
-- - created_at_chile: debe mostrar 16:06:37 (3 horas menos que UTC)
--
-- 3. Verificar TODAS las 7 vistas recreadas:
-- SELECT COUNT(*) FROM active_requests;
-- SELECT COUNT(*) FROM production_requests;
-- SELECT COUNT(*) FROM pending_earnings;
-- SELECT * FROM photographer_earnings_summary;
-- SELECT * FROM director_earnings_summary;
-- SELECT COUNT(*) FROM settlements_detail;
-- SELECT COUNT(*) FROM adjustments_history;
--
-- 4. Verificar que todas las vistas muestran datos correctos con ambas estructuras JSON
--
-- ============================================================================
-- FIN DEL SCRIPT - Las 7 vistas del sistema incluidas
-- ============================================================================

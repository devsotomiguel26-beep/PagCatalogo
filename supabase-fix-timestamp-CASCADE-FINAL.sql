-- ============================================================================
-- FIX TIMESTAMP TIMEZONE - ENFOQUE CASCADE (DESTRUCTIVO pero EFECTIVO)
-- ============================================================================
-- PROBLEMA: Hay múltiples vistas que dependen de columnas timestamp
-- Cada intento de ALTER revela una nueva vista dependiente
--
-- SOLUCIÓN: Usar CASCADE para que PostgreSQL elimine automáticamente
-- TODAS las vistas dependientes, hacer el cambio, y luego recrearlas
--
-- ⚠️  ADVERTENCIA: Este script ELIMINARÁ temporalmente todas las vistas
-- que dependan de photo_requests. Se recrearán al final del script.
-- ============================================================================

-- ============================================================================
-- PASO 1: Listar vistas existentes (para registro)
-- ============================================================================
-- Puedes ejecutar esto primero por separado para ver qué vistas existen:
/*
SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
*/

-- ============================================================================
-- PASO 2: Convertir created_at con CASCADE (elimina vistas automáticamente)
-- ============================================================================

ALTER TABLE photo_requests
ALTER COLUMN created_at TYPE timestamptz
USING created_at AT TIME ZONE 'UTC'
CASCADE;

ALTER TABLE photo_requests
ALTER COLUMN created_at SET DEFAULT NOW();

COMMENT ON COLUMN photo_requests.created_at IS 'Timestamp with timezone - convertido 2026-01-19 para corregir bug de timezone';

-- ============================================================================
-- PASO 3: Convertir otras columnas timestamp (OPCIONAL pero recomendado)
-- ============================================================================

ALTER TABLE photo_requests
ALTER COLUMN photos_sent_at TYPE timestamptz
USING CASE
  WHEN photos_sent_at IS NULL THEN NULL
  ELSE photos_sent_at AT TIME ZONE 'UTC'
END
CASCADE;

ALTER TABLE photo_requests
ALTER COLUMN download_links_expires_at TYPE timestamptz
USING CASE
  WHEN download_links_expires_at IS NULL THEN NULL
  ELSE download_links_expires_at AT TIME ZONE 'UTC'
END
CASCADE;

ALTER TABLE photo_requests
ALTER COLUMN payment_date TYPE timestamptz
USING CASE
  WHEN payment_date IS NULL THEN NULL
  ELSE payment_date AT TIME ZONE 'UTC'
END
CASCADE;

ALTER TABLE photo_requests
ALTER COLUMN cancelled_at TYPE timestamptz
USING CASE
  WHEN cancelled_at IS NULL THEN NULL
  ELSE cancelled_at AT TIME ZONE 'UTC'
END
CASCADE;

-- ============================================================================
-- PASO 4: Recrear vistas esenciales
-- ============================================================================

-- Vista 1: active_requests
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE (is_archived IS NOT TRUE OR is_archived IS NULL)
  AND (is_test IS NOT TRUE OR is_test IS NULL)
  AND status NOT IN ('cancelled', 'abandoned');

-- Vista 2: production_requests
CREATE OR REPLACE VIEW production_requests AS
SELECT *
FROM photo_requests
WHERE COALESCE(is_test, false) = false
ORDER BY created_at DESC;

-- Vista 3: pending_earnings (con soporte para ambas estructuras JSON)
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

-- Vista 4: photographer_earnings_summary
CREATE OR REPLACE VIEW photographer_earnings_summary AS
SELECT
  p.id as photographer_id,
  p.name as photographer_name,
  p.email as photographer_email,
  p.active,
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
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

-- Vista 5: director_earnings_summary
CREATE OR REPLACE VIEW director_earnings_summary AS
SELECT
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
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

-- Vista 6: settlements_detail
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
  (
    SELECT SUM(ARRAY_LENGTH(pr.photo_ids, 1))
    FROM photo_requests pr
    WHERE pr.id = ANY(s.photo_request_ids)
  ) as total_photos
FROM settlements s
ORDER BY s.settlement_date DESC, s.created_at DESC;

-- Vista 7: adjustments_history
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

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecuta esto para verificar que funcionó:
--
-- SELECT
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_name = 'photo_requests'
--   AND column_name IN ('created_at', 'payment_date', 'photos_sent_at');
--
-- SELECT
--   client_name,
--   created_at,
--   created_at AT TIME ZONE 'America/Santiago' as hora_chile
-- FROM photo_requests
-- WHERE client_name ILIKE '%hugo%cerda%';
--
-- ✅ Resultado esperado:
-- - data_type debe ser 'timestamp with time zone' para todas
-- - hora_chile debe mostrar 16:06:37 (NO 19:06:37)
-- ============================================================================

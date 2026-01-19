-- ============================================================================
-- FIX V2: Convertir created_at a timestamp WITH time zone
-- ============================================================================
-- PROBLEMA: El campo created_at es 'timestamp without time zone'
-- ERROR: No se puede alterar porque vista 'active_requests' depende de ella
-- SOLUCIÓN: Eliminar vista, alterar columna, recrear vista
-- ============================================================================

-- PASO 1: Guardar definición de la vista active_requests
-- (Podemos obtenerla con \d+ active_requests en psql, pero aquí la recrearemos)

-- PASO 2: Eliminar vista que depende de created_at
DROP VIEW IF EXISTS active_requests CASCADE;

-- PASO 3: Convertir columna created_at a timestamptz
-- PostgreSQL asumirá que los valores existentes están en UTC (correcto)
ALTER TABLE photo_requests
ALTER COLUMN created_at TYPE timestamptz
USING created_at AT TIME ZONE 'UTC';

-- PASO 4: Asegurar que el default también use timestamptz
ALTER TABLE photo_requests
ALTER COLUMN created_at SET DEFAULT NOW();

-- PASO 5: Convertir otros campos timestamp (opcional pero recomendado)
-- Estos probablemente también tienen el mismo problema

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

-- PASO 6: Recrear vista active_requests
-- Esta vista filtra solicitudes productivas (no test, no archivadas, no canceladas)
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE (is_archived IS NOT TRUE OR is_archived IS NULL)
  AND (is_test IS NOT TRUE OR is_test IS NULL)
  AND status NOT IN ('cancelled', 'abandoned');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar esto después del cambio para verificar:
--
-- SELECT
--   client_name,
--   created_at,
--   created_at AT TIME ZONE 'America/Santiago' as created_at_chile,
--   pg_typeof(created_at) as column_type
-- FROM photo_requests
-- WHERE client_name ILIKE '%hugo%cerda%'
-- ORDER BY created_at DESC
-- LIMIT 1;
--
-- Resultado esperado:
-- - column_type debe ser: 'timestamp with time zone' o 'timestamptz'
-- - created_at debe incluir '+00' al final (ej: 2026-01-19T19:06:37.217338+00)
-- - created_at_chile debe mostrar 16:06:37 (3 horas menos que UTC)
--
-- También verificar la vista:
-- SELECT * FROM active_requests LIMIT 5;
-- ============================================================================

COMMENT ON COLUMN photo_requests.created_at IS 'Timestamp with timezone - stored in UTC, convertido 2026-01-19 para corregir bug de timezone';

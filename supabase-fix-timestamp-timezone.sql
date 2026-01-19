-- ============================================================================
-- FIX: Convertir created_at a timestamp WITH time zone
-- ============================================================================
-- PROBLEMA: El campo created_at es 'timestamp without time zone', lo que causa
-- que JavaScript interprete mal las fechas y agregue/reste horas incorrectamente
--
-- SOLUCIÓN: Convertir a 'timestamptz' para que siempre se almacene con zona horaria
-- ============================================================================

-- 1. Convertir columna created_at a timestamptz
-- PostgreSQL asumirá que los valores existentes están en UTC
ALTER TABLE photo_requests
ALTER COLUMN created_at TYPE timestamptz
USING created_at AT TIME ZONE 'UTC';

-- 2. Asegurar que el default también use timestamptz
ALTER TABLE photo_requests
ALTER COLUMN created_at SET DEFAULT NOW();

-- 3. Opcional: Actualizar otros campos de timestamp si existen
-- Descomentar y ajustar según sea necesario:

-- ALTER TABLE photo_requests
-- ALTER COLUMN photos_sent_at TYPE timestamptz
-- USING photos_sent_at AT TIME ZONE 'UTC';

-- ALTER TABLE photo_requests
-- ALTER COLUMN download_links_expires_at TYPE timestamptz
-- USING download_links_expires_at AT TIME ZONE 'UTC';

-- ALTER TABLE photo_requests
-- ALTER COLUMN payment_date TYPE timestamptz
-- USING payment_date AT TIME ZONE 'UTC';

-- ALTER TABLE photo_requests
-- ALTER COLUMN cancelled_at TYPE timestamptz
-- USING cancelled_at AT TIME ZONE 'UTC';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar esto después del cambio para verificar:
--
-- SELECT
--   client_name,
--   created_at,
--   created_at AT TIME ZONE 'America/Santiago' as created_at_chile
-- FROM photo_requests
-- WHERE client_name ILIKE '%hugo%cerda%'
-- ORDER BY created_at DESC
-- LIMIT 1;
--
-- Ahora created_at debe incluir '+00' al final indicando UTC
-- y created_at_chile debe mostrar la hora correcta de Chile
-- ============================================================================

-- ============================================================================
-- FIX TIMESTAMP TIMEZONE - ENFOQUE SIMPLE Y DIRECTO
-- ============================================================================
-- PROBLEMA: Múltiples vistas dependen de las columnas timestamp
-- SOLUCIÓN: Dejar que PostgreSQL maneje las dependencias automáticamente
--
-- IMPORTANTE: Este script eliminará TODAS las vistas que dependan de
-- las columnas timestamp de photo_requests. Después deberás recrearlas.
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Convertir solo created_at (la columna principal del problema)
-- ============================================================================

-- Esta es la conversión más segura - solo afecta created_at
ALTER TABLE photo_requests
ALTER COLUMN created_at TYPE timestamptz
USING created_at AT TIME ZONE 'UTC'
CASCADE;

ALTER TABLE photo_requests
ALTER COLUMN created_at SET DEFAULT NOW();

-- ============================================================================
-- OPCIÓN 2: Convertir TODAS las columnas timestamp (OPCIONAL)
-- ============================================================================
-- Si quieres convertir todas las columnas timestamp de una vez,
-- DESCOMENTA las siguientes líneas:

-- ALTER TABLE photo_requests
-- ALTER COLUMN photos_sent_at TYPE timestamptz
-- USING CASE
--   WHEN photos_sent_at IS NULL THEN NULL
--   ELSE photos_sent_at AT TIME ZONE 'UTC'
-- END
-- CASCADE;

-- ALTER TABLE photo_requests
-- ALTER COLUMN download_links_expires_at TYPE timestamptz
-- USING CASE
--   WHEN download_links_expires_at IS NULL THEN NULL
--   ELSE download_links_expires_at AT TIME ZONE 'UTC'
-- END
-- CASCADE;

-- ALTER TABLE photo_requests
-- ALTER COLUMN payment_date TYPE timestamptz
-- USING CASE
--   WHEN payment_date IS NULL THEN NULL
--   ELSE payment_date AT TIME ZONE 'UTC'
-- END
-- CASCADE;

-- ALTER TABLE photo_requests
-- ALTER COLUMN cancelled_at TYPE timestamptz
-- USING CASE
--   WHEN cancelled_at IS NULL THEN NULL
--   ELSE cancelled_at AT TIME ZONE 'UTC'
-- END
-- CASCADE;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esto después para verificar el cambio:
--
-- SELECT
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_name = 'photo_requests'
--   AND column_name = 'created_at';
--
-- Resultado esperado: data_type = 'timestamp with time zone'
--
-- Verificar Hugo Cerda:
-- SELECT
--   client_name,
--   created_at,
--   created_at AT TIME ZONE 'America/Santiago' as hora_chile
-- FROM photo_requests
-- WHERE client_name ILIKE '%hugo%cerda%';
--
-- Resultado esperado: hora_chile debe mostrar 16:06 (no 19:06)
-- ============================================================================

-- ============================================================================
-- RECREAR VISTAS (DESPUÉS DE EJECUTAR ESTE SQL)
-- ============================================================================
-- ADVERTENCIA: El CASCADE eliminará todas las vistas que dependan de created_at
--
-- Después de ejecutar este SQL, necesitarás recrear las vistas.
-- Ejecuta en orden:
--
-- 1. supabase-fix-pending-earnings-view-v2.sql (pending_earnings)
-- 2. Recrear otras vistas manualmente según las necesites
--
-- Lista de vistas que probablemente se eliminarán:
-- - active_requests
-- - production_requests
-- - pending_earnings
-- - photographer_earnings_summary
-- - director_earnings_summary
-- - settlements_detail
-- - adjustments_history
-- - payment_details_view
-- - (posiblemente otras)
--
-- ============================================================================

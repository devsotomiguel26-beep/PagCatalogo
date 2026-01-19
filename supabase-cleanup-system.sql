-- ============================================================================
-- MIGRACIÓN: Sistema de limpieza y clasificación de solicitudes
-- ============================================================================
-- Resuelve:
-- 1. Solicitudes abandonadas que nunca pagan
-- 2. Solicitudes de prueba que contaminan reportes
-- 3. Necesidad de archivar solicitudes viejas
-- ============================================================================

-- 1. Agregar nuevos estados a enum (si usas enum)
-- Si no usas enum, skip este paso
-- ALTER TYPE request_status ADD VALUE 'cancelled';
-- ALTER TYPE request_status ADD VALUE 'abandoned';

-- 2. Agregar columnas de clasificación
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

COMMENT ON COLUMN photo_requests.is_test IS 'TRUE si es una solicitud de prueba (excluida de reportes y liquidaciones)';
COMMENT ON COLUMN photo_requests.is_archived IS 'TRUE si está archivada (oculta en listado principal)';
COMMENT ON COLUMN photo_requests.cancelled_at IS 'Fecha y hora de cancelación';
COMMENT ON COLUMN photo_requests.cancelled_by IS 'Quién canceló: admin/system/user';
COMMENT ON COLUMN photo_requests.cancel_reason IS 'Razón de la cancelación';

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_photo_requests_is_test ON photo_requests(is_test);
CREATE INDEX IF NOT EXISTS idx_photo_requests_is_archived ON photo_requests(is_archived);
CREATE INDEX IF NOT EXISTS idx_photo_requests_cancelled_at ON photo_requests(cancelled_at);

-- 4. Vista para solicitudes activas (excluye pruebas y archivadas)
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE is_test = FALSE
  AND is_archived = FALSE
ORDER BY created_at DESC;

COMMENT ON VIEW active_requests IS 'Solicitudes activas (sin pruebas ni archivadas)';

-- 5. Vista para solicitudes de producción (para reportes)
CREATE OR REPLACE VIEW production_requests AS
SELECT *
FROM photo_requests
WHERE is_test = FALSE
ORDER BY created_at DESC;

COMMENT ON VIEW production_requests IS 'Solo solicitudes reales (excluye pruebas)';

-- 6. Función para marcar solicitudes abandonadas (manual o automática)
CREATE OR REPLACE FUNCTION mark_as_abandoned(
  request_id UUID,
  reason TEXT DEFAULT 'No se completó el pago'
)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_requests
  SET
    status = 'abandoned',
    cancelled_at = NOW(),
    cancelled_by = 'system',
    cancel_reason = reason
  WHERE id = request_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_as_abandoned IS 'Marca una solicitud como abandonada';

-- 7. Función para marcar como prueba
CREATE OR REPLACE FUNCTION mark_as_test(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_requests
  SET is_test = TRUE
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_as_test IS 'Marca una solicitud como prueba (excluida de reportes)';

-- 8. Función para cancelar solicitud manualmente
CREATE OR REPLACE FUNCTION cancel_request(
  request_id UUID,
  cancelled_by_user VARCHAR(255),
  reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_requests
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = cancelled_by_user,
    cancel_reason = reason
  WHERE id = request_id
    AND status IN ('pending', 'paid');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_request IS 'Cancela una solicitud manualmente';

-- 9. Marcar solicitudes pending viejas como abandonadas (EJECUCIÓN MANUAL)
-- ⚠️ EJECUTAR SOLO UNA VEZ AL PRINCIPIO
-- Esto marcará solicitudes pending con más de 48h como abandonadas
-- DESCOMENTA Y EJECUTA SI QUIERES LIMPIAR HISTÓRICO:

/*
UPDATE photo_requests
SET
  status = 'abandoned',
  cancelled_at = NOW(),
  cancelled_by = 'migration',
  cancel_reason = 'Limpieza histórica: No se completó el pago en 48 horas'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours'
  AND is_test = FALSE;
*/

-- 10. Verificar estado actual
SELECT
  status,
  is_test,
  is_archived,
  COUNT(*) as count
FROM photo_requests
GROUP BY status, is_test, is_archived
ORDER BY is_test, is_archived, status;

-- 11. Ver solicitudes que serían marcadas como abandonadas (SIN ejecutar)
SELECT
  id,
  client_name,
  client_email,
  created_at,
  EXTRACT(HOUR FROM (NOW() - created_at)) as hours_since_created
FROM photo_requests
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours'
  AND is_test = FALSE
ORDER BY created_at DESC;

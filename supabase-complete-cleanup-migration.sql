-- ============================================================================
-- MIGRACIÓN COMPLETA: Sistema de limpieza + Exclusión de pruebas
-- ============================================================================
-- Este archivo combina:
-- 1. Sistema de limpieza y clasificación de solicitudes
-- 2. Actualización de vistas para excluir solicitudes de prueba
-- ============================================================================

-- ============================================================================
-- PARTE 1: Sistema de limpieza (de supabase-cleanup-system.sql)
-- ============================================================================

-- 1. Agregar columnas de clasificación
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

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_photo_requests_is_test ON photo_requests(is_test);
CREATE INDEX IF NOT EXISTS idx_photo_requests_is_archived ON photo_requests(is_archived);
CREATE INDEX IF NOT EXISTS idx_photo_requests_cancelled_at ON photo_requests(cancelled_at);

-- 3. Vista para solicitudes activas (excluye pruebas y archivadas)
CREATE OR REPLACE VIEW active_requests AS
SELECT *
FROM photo_requests
WHERE COALESCE(is_test, false) = false
  AND COALESCE(is_archived, false) = false
ORDER BY created_at DESC;

COMMENT ON VIEW active_requests IS 'Solicitudes activas (sin pruebas ni archivadas)';

-- 4. Vista para solicitudes de producción (para reportes)
CREATE OR REPLACE VIEW production_requests AS
SELECT *
FROM photo_requests
WHERE COALESCE(is_test, false) = false
ORDER BY created_at DESC;

COMMENT ON VIEW production_requests IS 'Solo solicitudes reales (excluye pruebas)';

-- 5. Función para marcar solicitudes abandonadas
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

-- 6. Función para marcar como prueba
CREATE OR REPLACE FUNCTION mark_as_test(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_requests
  SET is_test = TRUE
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_as_test IS 'Marca una solicitud como prueba (excluida de reportes)';

-- 7. Función para cancelar solicitud manualmente
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

-- ============================================================================
-- PARTE 2: Actualizar vistas de ganancias para excluir pruebas
-- ============================================================================

-- Vista: Ganancias pendientes de distribuir (ACTUALIZADA - excluye pruebas)
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
  (pr.transaction_details->'breakdown'->>'photographer_share')::numeric as photographer_share,
  (pr.transaction_details->'breakdown'->>'director_share')::numeric as director_share,
  (pr.transaction_details->'breakdown'->>'photographer_percentage')::numeric as photographer_pct,
  (pr.transaction_details->'breakdown'->>'director_percentage')::numeric as director_pct
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.settlement_status != 'settled'
  AND pr.transaction_details IS NOT NULL
  AND COALESCE(pr.is_test, false) = false  -- NUEVA LÍNEA: Excluir pruebas
ORDER BY pr.created_at DESC;

COMMENT ON VIEW pending_earnings IS 'Ganancias pendientes de pago a fotógrafos y director (excluye solicitudes de prueba)';

-- Vista: Resumen de ganancias por fotógrafo (ACTUALIZADA - excluye pruebas)
CREATE OR REPLACE VIEW photographer_earnings_summary AS
SELECT
  p.id as photographer_id,
  p.name as photographer_name,
  p.email as photographer_email,
  p.active,
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
  SUM((pr.transaction_details->'breakdown'->>'photographer_share')::numeric) as total_earnings,
  SUM(
    CASE WHEN pr.settlement_status = 'settled'
    THEN (pr.transaction_details->'breakdown'->>'photographer_share')::numeric
    ELSE 0 END
  ) as paid_amount,
  SUM(
    CASE WHEN pr.settlement_status != 'settled'
    THEN (pr.transaction_details->'breakdown'->>'photographer_share')::numeric
    ELSE 0 END
  ) as pending_amount,
  MIN(pr.created_at) as first_request_date,
  MAX(pr.created_at) as last_request_date
FROM photographers p
LEFT JOIN galleries g ON g.photographer_id = p.id
LEFT JOIN photo_requests pr ON pr.gallery_id = g.id
  AND pr.status IN ('paid', 'delivered', 'expired')
  AND pr.transaction_details IS NOT NULL
  AND COALESCE(pr.is_test, false) = false  -- NUEVA LÍNEA: Excluir pruebas
GROUP BY p.id, p.name, p.email, p.active
ORDER BY pending_amount DESC NULLS LAST;

COMMENT ON VIEW photographer_earnings_summary IS 'Resumen de ganancias por fotógrafo: total, pagado, pendiente (excluye solicitudes de prueba)';

-- Vista: Resumen de ganancias del director (ACTUALIZADA - excluye pruebas)
CREATE OR REPLACE VIEW director_earnings_summary AS
SELECT
  COUNT(DISTINCT pr.id) as total_requests,
  SUM(ARRAY_LENGTH(pr.photo_ids, 1)) as total_photos,
  SUM((pr.transaction_details->'breakdown'->>'director_share')::numeric) as total_earnings,
  SUM(
    CASE WHEN pr.settlement_status = 'settled'
    THEN (pr.transaction_details->'breakdown'->>'director_share')::numeric
    ELSE 0 END
  ) as paid_amount,
  SUM(
    CASE WHEN pr.settlement_status != 'settled'
    THEN (pr.transaction_details->'breakdown'->>'director_share')::numeric
    ELSE 0 END
  ) as pending_amount,
  MIN(pr.created_at) as first_request_date,
  MAX(pr.created_at) as last_request_date
FROM photo_requests pr
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.transaction_details IS NOT NULL
  AND COALESCE(pr.is_test, false) = false;  -- NUEVA LÍNEA: Excluir pruebas

COMMENT ON VIEW director_earnings_summary IS 'Resumen de ganancias totales del director (excluye solicitudes de prueba)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estado actual por categoría
SELECT
  status,
  COALESCE(is_test, false) as is_test,
  COALESCE(is_archived, false) as is_archived,
  COUNT(*) as count
FROM photo_requests
GROUP BY status, is_test, is_archived
ORDER BY is_test, is_archived, status;

-- Ver solicitudes que serían marcadas como abandonadas (>48h pendientes)
SELECT
  id,
  client_name,
  client_email,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_since_created,
  COALESCE(is_test, false) as is_test
FROM photo_requests
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours'
  AND COALESCE(is_test, false) = false
ORDER BY created_at DESC;

-- ============================================================================
-- NOTAS DE EJECUCIÓN
-- ============================================================================

-- IMPORTANTE:
-- 1. Esta migración es segura y se puede ejecutar en producción
-- 2. Las columnas nuevas tienen valores DEFAULT, no afecta datos existentes
-- 3. Las vistas se actualizan en lugar de sobrescribir
-- 4. Use manage-abandoned-requests.mjs para marcar solicitudes viejas
-- 5. Las solicitudes de prueba ahora están excluidas de todas las liquidaciones
--
-- Para ejecutar en Supabase:
-- 1. Ir a: Dashboard → SQL Editor
-- 2. Pegar todo este contenido
-- 3. Click "Run" (ejecutar)
-- 4. Verificar con las queries de la sección VERIFICACIÓN

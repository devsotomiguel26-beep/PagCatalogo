-- Migración: Actualizar sistema de estados
-- 1. Eliminar estado 'contacted' (no se usa automáticamente)
-- 2. Agregar estado 'expired' para enlaces vencidos
-- 3. Crear función automática para marcar solicitudes expiradas

-- ============================================================================
-- PASO 1: Eliminar estado 'contacted'
-- ============================================================================

-- Ver cuántas solicitudes tienen estado 'contacted'
SELECT COUNT(*) as contacted_count
FROM photo_requests
WHERE status = 'contacted';

-- Convertir todas las solicitudes 'contacted' a 'pending'
-- Razón: 'contacted' nunca se usaba automáticamente, solo manual
UPDATE photo_requests
SET
  status = 'pending',
  updated_at = NOW()
WHERE status = 'contacted';

COMMENT ON COLUMN photo_requests.status IS 'Estado de la solicitud: pending (inicial), paid (pago confirmado), delivered (fotos enviadas), expired (enlaces vencidos). Estados automáticos.';

-- ============================================================================
-- PASO 2: Marcar solicitudes con enlaces expirados
-- ============================================================================

-- Identificar solicitudes con enlaces expirados (más de 7 días)
SELECT
  id,
  status,
  client_name,
  download_links_expires_at,
  EXTRACT(DAY FROM (NOW() - download_links_expires_at)) as days_expired
FROM photo_requests
WHERE download_links_expires_at < NOW()
  AND status = 'delivered'
ORDER BY download_links_expires_at DESC;

-- Actualizar solicitudes con enlaces expirados a status 'expired'
UPDATE photo_requests
SET
  status = 'expired',
  updated_at = NOW()
WHERE download_links_expires_at < NOW()
  AND status = 'delivered';

-- ============================================================================
-- PASO 3: Crear función para marcar automáticamente como expirados
-- ============================================================================

-- Función que se puede ejecutar periódicamente (cron job)
CREATE OR REPLACE FUNCTION mark_expired_requests()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  count INTEGER;
BEGIN
  -- Actualizar solicitudes expiradas
  UPDATE photo_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE download_links_expires_at < NOW()
    AND status = 'delivered';

  GET DIAGNOSTICS count = ROW_COUNT;

  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- Comentario en la función
COMMENT ON FUNCTION mark_expired_requests() IS 'Marca automáticamente las solicitudes con enlaces expirados. Ejecutar diariamente con cron job.';

-- ============================================================================
-- PASO 4: Crear vista para métricas y dashboard
-- ============================================================================

-- Vista con estadísticas por estado
CREATE OR REPLACE VIEW photo_requests_stats AS
SELECT
  status,
  COUNT(*) as total_requests,
  SUM(ARRAY_LENGTH(photo_ids, 1)) as total_photos,
  SUM(ARRAY_LENGTH(photo_ids, 1) * 2000) as total_revenue_clp,
  AVG(ARRAY_LENGTH(photo_ids, 1)) as avg_photos_per_request,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as requests_last_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as requests_last_30_days
FROM photo_requests
GROUP BY status;

COMMENT ON VIEW photo_requests_stats IS 'Estadísticas agregadas por estado para dashboard de métricas';

-- Vista con métricas de conversión
CREATE OR REPLACE VIEW conversion_metrics AS
SELECT
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status IN ('paid', 'delivered', 'expired') THEN 1 END) as paid_requests,
  COUNT(CASE WHEN status IN ('delivered', 'expired') THEN 1 END) as delivered_requests,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_requests,
  ROUND(
    100.0 * COUNT(CASE WHEN status IN ('paid', 'delivered', 'expired') THEN 1 END) /
    NULLIF(COUNT(*), 0),
    2
  ) as conversion_rate_percent,
  ROUND(
    100.0 * COUNT(CASE WHEN status IN ('delivered', 'expired') THEN 1 END) /
    NULLIF(COUNT(CASE WHEN status IN ('paid', 'delivered', 'expired') THEN 1 END), 0),
    2
  ) as delivery_rate_percent,
  SUM(CASE WHEN status IN ('paid', 'delivered', 'expired')
    THEN ARRAY_LENGTH(photo_ids, 1) * 2000
    ELSE 0
  END) as total_revenue_clp,
  AVG(CASE WHEN status IN ('paid', 'delivered', 'expired')
    THEN ARRAY_LENGTH(photo_ids, 1) * 2000
  END) as avg_order_value_clp
FROM photo_requests
WHERE created_at >= NOW() - INTERVAL '90 days'; -- Últimos 90 días

COMMENT ON VIEW conversion_metrics IS 'Métricas de conversión y rendimiento del negocio';

-- Vista con actividad diaria (últimos 30 días)
CREATE OR REPLACE VIEW daily_activity AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status IN ('paid', 'delivered', 'expired') THEN 1 END) as paid,
  COUNT(CASE WHEN status IN ('delivered', 'expired') THEN 1 END) as delivered,
  SUM(ARRAY_LENGTH(photo_ids, 1)) as total_photos,
  SUM(CASE WHEN status IN ('paid', 'delivered', 'expired')
    THEN ARRAY_LENGTH(photo_ids, 1) * 2000
    ELSE 0
  END) as daily_revenue_clp
FROM photo_requests
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_activity IS 'Actividad diaria para gráficos del dashboard';

-- ============================================================================
-- PASO 5: Verificación final
-- ============================================================================

-- Resumen de estados actual
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM photo_requests
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'paid' THEN 2
    WHEN 'delivered' THEN 3
    WHEN 'expired' THEN 4
    ELSE 5
  END;

-- Verificar que no hay estado 'contacted'
SELECT COUNT(*) as contacted_count_should_be_zero
FROM photo_requests
WHERE status = 'contacted';

-- Ver estadísticas generales
SELECT * FROM photo_requests_stats ORDER BY total_requests DESC;

-- Ver métricas de conversión
SELECT * FROM conversion_metrics;

-- Ver actividad reciente
SELECT * FROM daily_activity LIMIT 7;

-- ============================================================================
-- PASO 6 (OPCIONAL): Configurar cron job para marcar expirados
-- ============================================================================

-- Opción A: Usar pg_cron (si está disponible)
/*
SELECT cron.schedule(
  'mark-expired-requests',
  '0 2 * * *', -- Ejecutar a las 2 AM todos los días
  $$SELECT mark_expired_requests()$$
);
*/

-- Opción B: Crear un webhook de Supabase Edge Function
-- O ejecutar manualmente la función cuando sea necesario:
-- SELECT mark_expired_requests();

-- ============================================================================
-- Notas finales
-- ============================================================================

-- IMPORTANTE: Después de ejecutar esta migración:
-- 1. El estado 'contacted' ya no existe
-- 2. Las solicitudes con enlaces expirados tienen status 'expired'
-- 3. Hay vistas SQL para métricas del dashboard
-- 4. Configurar cron job o ejecutar mark_expired_requests() diariamente

-- Estados válidos ahora:
-- - pending: Solicitud creada, esperando pago
-- - paid: Pago confirmado, fotos enviándose
-- - delivered: Fotos enviadas, enlaces activos
-- - expired: Fotos enviadas pero enlaces expirados (>7 días)

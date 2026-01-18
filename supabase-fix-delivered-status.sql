-- Migración: Corregir estados de solicitudes con fotos enviadas
-- Problema: Solicitudes con photos_sent_at pero status != 'delivered'
-- Solución: Actualizar automáticamente todas las solicitudes inconsistentes

-- Paso 1: Verificar cuántas solicitudes están inconsistentes
SELECT
  COUNT(*) as inconsistent_requests,
  status,
  COUNT(CASE WHEN photos_sent_at IS NOT NULL THEN 1 END) as with_photos_sent
FROM photo_requests
WHERE photos_sent_at IS NOT NULL
  AND status != 'delivered'
GROUP BY status;

-- Paso 2: Ver detalles de solicitudes inconsistentes (para auditoría)
SELECT
  id,
  status,
  photos_sent_at,
  download_links_expires_at,
  client_name,
  client_email,
  created_at
FROM photo_requests
WHERE photos_sent_at IS NOT NULL
  AND status != 'delivered'
ORDER BY created_at DESC
LIMIT 20;

-- Paso 3: CORRECCIÓN - Actualizar status a 'delivered'
-- Esto corrige todas las solicitudes que ya tienen fotos enviadas
UPDATE photo_requests
SET
  status = 'delivered',
  updated_at = NOW() -- Marcar que fueron actualizadas
WHERE photos_sent_at IS NOT NULL
  AND status != 'delivered';

-- Paso 4: Verificar corrección
SELECT
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN photos_sent_at IS NOT NULL THEN 1 END) as with_photos_sent,
  COUNT(CASE WHEN photos_sent_at IS NULL THEN 1 END) as without_photos_sent
FROM photo_requests
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'paid' THEN 3
    WHEN 'delivered' THEN 4
    ELSE 5
  END;

-- Paso 5: Verificar que no hay inconsistencias
-- Esta query NO debería devolver ninguna fila después de la corrección
SELECT
  id,
  status,
  photos_sent_at,
  client_name
FROM photo_requests
WHERE
  -- Inconsistencia 1: fotos enviadas pero no marcado como delivered
  (photos_sent_at IS NOT NULL AND status != 'delivered')
  OR
  -- Inconsistencia 2: marcado como delivered pero sin fotos enviadas
  (status = 'delivered' AND photos_sent_at IS NULL);

-- Si esta query devuelve filas, hay un problema que necesita investigación manual

-- Paso 6 (Opcional): Crear índice para mejorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_photo_requests_status ON photo_requests(status);
CREATE INDEX IF NOT EXISTS idx_photo_requests_photos_sent_at ON photo_requests(photos_sent_at);

-- Comentarios finales
COMMENT ON COLUMN photo_requests.status IS 'Estado de la solicitud: pending (inicial), paid (pago confirmado), delivered (fotos enviadas). IMPORTANTE: Se actualiza automáticamente a delivered cuando photos_sent_at tiene valor.';

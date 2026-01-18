-- Agregar columnas para trackear entregas y reenvíos de fotos
-- Sistema integral de gestión de entrega para equipo de soporte

-- Contador de intentos de entrega
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 0;

-- Historial completo de entregas (JSONB para flexibilidad)
-- Formato: [{ sentAt: "2024-01-15T10:30:00Z", sentTo: "email@example.com", sentBy: "admin", linksExpireAt: "2024-01-22T10:30:00Z" }]
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS delivery_history JSONB DEFAULT '[]'::jsonb;

-- Último email al que se enviaron las fotos (puede diferir del client_email si se corrigió)
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS last_delivery_email TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN photo_requests.delivery_attempts IS 'Número total de veces que se han enviado las fotos al cliente';
COMMENT ON COLUMN photo_requests.delivery_history IS 'Historial completo de entregas: fecha, destinatario, expiración de enlaces';
COMMENT ON COLUMN photo_requests.last_delivery_email IS 'Último email al que se enviaron las fotos (puede diferir de client_email si se corrigió)';

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'photo_requests'
AND column_name IN ('delivery_attempts', 'delivery_history', 'last_delivery_email', 'photos_sent_at', 'download_links_expires_at');

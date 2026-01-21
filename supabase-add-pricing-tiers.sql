-- Migration: Agregar campos de pricing tiers a photo_requests
-- Fecha: 2026-01-20
-- Descripción: Sistema de descuentos por rangos de cantidad de fotos

-- Agregar nuevas columnas a photo_requests
ALTER TABLE photo_requests
  ADD COLUMN IF NOT EXISTS base_price_per_photo INT DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS discount_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier_name VARCHAR(50);

-- Actualizar datos existentes para que tengan los valores por defecto
UPDATE photo_requests
SET
  base_price_per_photo = COALESCE(price_per_photo, 2000),
  discount_amount = 0,
  discount_percentage = 0,
  tier_name = 'Precio Normal'
WHERE base_price_per_photo IS NULL;

-- Agregar comentarios para documentación
COMMENT ON COLUMN photo_requests.base_price_per_photo IS 'Precio base por foto sin descuento (ej: $2000)';
COMMENT ON COLUMN photo_requests.discount_amount IS 'Monto total de descuento aplicado en pesos';
COMMENT ON COLUMN photo_requests.discount_percentage IS 'Porcentaje de descuento aplicado (ej: 10, 20, 30)';
COMMENT ON COLUMN photo_requests.tier_name IS 'Nombre del tier de pricing aplicado (ej: Pack 5-9 Fotos)';

-- Verificación
SELECT
  id,
  client_name,
  ARRAY_LENGTH(photo_ids, 1) as photo_count,
  base_price_per_photo,
  price_per_photo,
  discount_amount,
  discount_percentage,
  tier_name
FROM photo_requests
WHERE status IN ('paid', 'delivered')
ORDER BY created_at DESC
LIMIT 5;

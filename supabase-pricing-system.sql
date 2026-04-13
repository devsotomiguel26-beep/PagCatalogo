-- ============================================================
-- Migración: Sistema de Precios Dinámico desde Base de Datos
-- Reemplaza las variables de entorno TIER_X_* y BASE_PRICE_PER_PHOTO
-- ============================================================

-- 1. Tabla de configuración global de precios (fila única)
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_price_per_photo INT NOT NULL DEFAULT 2000,
  pricing_tiers_enabled BOOLEAN NOT NULL DEFAULT true,
  currency VARCHAR(10) NOT NULL DEFAULT 'CLP',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- 2. Tabla de tiers de descuento por volumen
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  min_photos INT NOT NULL,
  max_photos INT,  -- NULL = sin límite superior
  price_per_photo INT NOT NULL,
  discount_percentage INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sort ON pricing_tiers (sort_order);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON pricing_tiers (is_active);

-- 3. Seed: configuración global (mismos valores que env vars actuales)
INSERT INTO pricing_config (base_price_per_photo, pricing_tiers_enabled, currency)
VALUES (2000, true, 'CLP');

-- 4. Seed: tiers de descuento (mismos valores que env vars actuales)
INSERT INTO pricing_tiers (name, min_photos, max_photos, price_per_photo, discount_percentage, sort_order) VALUES
  ('Precio Normal',     1,    4,    2000, 0,  0),
  ('Pack 5-9 Fotos',    5,    9,    1800, 10, 1),
  ('Pack 10-14 Fotos',  10,   14,   1600, 20, 2),
  ('Pack 15+ Fotos',    15,   NULL, 1400, 30, 3);

-- 5. RLS (Row Level Security) - lectura pública, escritura solo con service role
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Lectura pública para que el frontend pueda consultar precios
CREATE POLICY "pricing_config_read" ON pricing_config
  FOR SELECT USING (true);

CREATE POLICY "pricing_tiers_read" ON pricing_tiers
  FOR SELECT USING (true);

-- Escritura solo para service role (admin API routes)
CREATE POLICY "pricing_config_admin_write" ON pricing_config
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "pricing_tiers_admin_write" ON pricing_tiers
  FOR ALL USING (auth.role() = 'service_role');

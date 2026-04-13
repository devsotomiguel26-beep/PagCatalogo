-- ============================================================
-- Migración: Sistema de Promociones y Códigos Promocionales
-- Depende de: supabase-pricing-system.sql
-- ============================================================

-- 1. Tabla de promociones
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Tipo de descuento
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'percentage_discount',    -- Descuento porcentual sobre el total
    'fixed_discount',         -- Descuento fijo en CLP sobre el total
    'fixed_price_per_photo',  -- Precio fijo por foto (override)
    'full_gallery'            -- Precio especial por galería completa
  )),

  -- Valores de descuento (usar según type)
  discount_percentage INT CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount INT CHECK (discount_amount >= 0),
  fixed_price_per_photo INT CHECK (fixed_price_per_photo >= 0),

  -- Alcance: ¿a qué aplica?
  scope VARCHAR(50) NOT NULL DEFAULT 'global' CHECK (scope IN (
    'global',       -- Aplica a todas las galerías
    'gallery',      -- Aplica solo a una galería específica
    'category',     -- Aplica a una categoría (Sub-10, Femenino, etc.)
    'event_type'    -- Aplica a un tipo de evento (torneo, partido, etc.)
  )),
  scope_gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  scope_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  scope_event_type VARCHAR(100),

  -- Condiciones
  min_photos INT DEFAULT 1,
  max_uses INT,              -- NULL = ilimitado
  current_uses INT NOT NULL DEFAULT 0,
  requires_code BOOLEAN NOT NULL DEFAULT false,

  -- Vigencia
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,       -- NULL = sin fecha de término

  -- Control
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,   -- Mayor = se evalúa primero
  stackable BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions (is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_scope ON promotions (scope, scope_gallery_id, scope_category_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions (type);

-- 2. Tabla de códigos promocionales
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  max_uses INT,              -- NULL = ilimitado
  current_uses INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice único case-insensitive para códigos
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_unique ON promo_codes (UPPER(code));

-- 3. Tabla de auditoría de uso de promociones
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  photo_request_id UUID NOT NULL REFERENCES photo_requests(id) ON DELETE CASCADE,
  discount_applied INT NOT NULL,  -- Monto de descuento aplicado en CLP
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage (promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_request ON promotion_usage (photo_request_id);

-- 4. Agregar columnas de promoción a photo_requests
ALTER TABLE photo_requests
  ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promotion_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS promotion_discount_amount INT DEFAULT 0;

-- 5. RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Lectura pública de promociones activas (para mostrar en UI)
CREATE POLICY "promotions_read" ON promotions
  FOR SELECT USING (true);

-- Lectura pública de códigos (validación)
CREATE POLICY "promo_codes_read" ON promo_codes
  FOR SELECT USING (true);

-- Lectura de uso solo admin
CREATE POLICY "promotion_usage_read" ON promotion_usage
  FOR SELECT USING (auth.role() = 'service_role');

-- Escritura solo service role
CREATE POLICY "promotions_admin_write" ON promotions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "promo_codes_admin_write" ON promo_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "promotion_usage_admin_write" ON promotion_usage
  FOR ALL USING (auth.role() = 'service_role');

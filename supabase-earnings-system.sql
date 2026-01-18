-- ============================================================================
-- Migración: Sistema Completo de Distribución de Ganancias
-- ============================================================================
-- Este sistema permite rastrear y distribuir ganancias entre fotógrafos y director
-- con total transparencia, trazabilidad y escalabilidad.
--
-- IMPORTANTE: Ejecutar en orden
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla de fotógrafos
-- ============================================================================

CREATE TABLE IF NOT EXISTS photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rut TEXT, -- RUT chileno para fines tributarios
  bank_account_info JSONB, -- Información bancaria (considerar cifrado)
  tax_id_type TEXT CHECK (tax_id_type IN ('boleta', 'factura', 'ninguno')),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE photographers IS 'Fotógrafos que trabajan para la academia. Cada galería puede tener un fotógrafo asignado.';
COMMENT ON COLUMN photographers.bank_account_info IS 'JSONB: {bank_name, account_type, account_number, holder_name}';
COMMENT ON COLUMN photographers.tax_id_type IS 'Tipo de documento tributario que emite el fotógrafo';

-- Índices
CREATE INDEX idx_photographers_active ON photographers(active);
CREATE INDEX idx_photographers_email ON photographers(email);

-- ============================================================================
-- PASO 2: Actualizar tabla galleries
-- ============================================================================

-- Agregar fotógrafo asignado a la galería
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL;

-- Configuración de comisiones por galería (override de defaults)
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT '{
  "photographer_percentage": 80,
  "director_percentage": 20,
  "payment_gateway_fee_percentage": 3.5,
  "config_created_at": null
}'::jsonb;

ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS commission_notes TEXT;

COMMENT ON COLUMN galleries.photographer_id IS 'Fotógrafo asignado a esta galería. NULL = sin asignar o el director mismo.';
COMMENT ON COLUMN galleries.commission_config IS 'Configuración de comisiones para esta galería. Permite override de defaults globales.';
COMMENT ON COLUMN galleries.commission_notes IS 'Notas sobre acuerdos especiales de comisión para esta galería.';

-- Índice
CREATE INDEX idx_galleries_photographer ON galleries(photographer_id);

-- ============================================================================
-- PASO 3: Actualizar tabla photo_requests
-- ============================================================================

-- Precio por foto al momento de la solicitud (snapshot)
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS price_per_photo INTEGER;

-- Detalles completos de la transacción
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS transaction_details JSONB;

-- Estado de liquidación
ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending' CHECK (
  settlement_status IN ('pending', 'partial', 'settled')
);

ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS settlement_notes TEXT;

COMMENT ON COLUMN photo_requests.price_per_photo IS 'Snapshot del precio por foto vigente al momento de la solicitud (inmutable).';
COMMENT ON COLUMN photo_requests.transaction_details IS 'JSONB: {gross_amount, payment_gateway_fee, net_amount, commission_snapshot, breakdown: {photographer_share, director_share}}';
COMMENT ON COLUMN photo_requests.settlement_status IS 'Estado de pago a fotógrafo/director: pending (sin pagar), partial (pago parcial), settled (pagado completo)';

-- Índices
CREATE INDEX idx_photo_requests_settlement_status ON photo_requests(settlement_status);

-- ============================================================================
-- PASO 4: Crear tabla de liquidaciones (settlements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('photographer', 'director')),
  recipient_id UUID, -- NULL para director, photographer_id para fotógrafos
  recipient_name TEXT NOT NULL, -- Nombre para histórico
  total_amount NUMERIC(10, 2) NOT NULL,
  photo_request_ids UUID[] NOT NULL, -- Array de IDs de photo_requests incluidas
  payment_method TEXT, -- 'transferencia', 'efectivo', 'cheque', etc.
  payment_proof_url TEXT, -- URL del comprobante en Supabase Storage
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  created_by TEXT, -- Email/nombre del admin que creó la liquidación
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_recipient_photographer FOREIGN KEY (recipient_id)
    REFERENCES photographers(id) ON DELETE SET NULL
);

COMMENT ON TABLE settlements IS 'Liquidaciones de pago a fotógrafos y director. Rastrea cuándo y cuánto se pagó por período.';
COMMENT ON COLUMN settlements.recipient_type IS 'Tipo de destinatario: photographer o director';
COMMENT ON COLUMN settlements.recipient_id IS 'ID del fotógrafo (NULL si es director)';
COMMENT ON COLUMN settlements.photo_request_ids IS 'Array de IDs de solicitudes incluidas en esta liquidación';
COMMENT ON COLUMN settlements.status IS 'Estado: pending (por pagar), paid (pagado), cancelled (cancelado)';

-- Índices
CREATE INDEX idx_settlements_recipient ON settlements(recipient_type, recipient_id);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_date ON settlements(settlement_date DESC);

-- ============================================================================
-- PASO 5: Crear tabla de ajustes manuales
-- ============================================================================

CREATE TABLE IF NOT EXISTS adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_request_id UUID NOT NULL REFERENCES photo_requests(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (
    adjustment_type IN ('refund', 'discount', 'bonus', 'correction', 'other')
  ),
  amount NUMERIC(10, 2) NOT NULL, -- Puede ser negativo
  affects_photographer BOOLEAN DEFAULT true,
  affects_director BOOLEAN DEFAULT true,
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE adjustments IS 'Ajustes manuales a solicitudes: reembolsos, descuentos, bonos, correcciones.';
COMMENT ON COLUMN adjustments.amount IS 'Monto del ajuste. Negativo para descuentos/reembolsos, positivo para bonos.';
COMMENT ON COLUMN adjustments.affects_photographer IS 'Si el ajuste afecta la ganancia del fotógrafo';
COMMENT ON COLUMN adjustments.affects_director IS 'Si el ajuste afecta la ganancia del director';

-- Índice
CREATE INDEX idx_adjustments_request ON adjustments(photo_request_id);

-- ============================================================================
-- PASO 6: Función para calcular distribución de ganancias
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_earnings_breakdown(
  p_gross_amount NUMERIC,
  p_gateway_fee NUMERIC,
  p_photographer_pct NUMERIC,
  p_director_pct NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_net_amount NUMERIC;
  v_photographer_share NUMERIC;
  v_director_share NUMERIC;
BEGIN
  -- Calcular monto neto (después de comisión de pasarela)
  v_net_amount := p_gross_amount - p_gateway_fee;

  -- Calcular share de fotógrafo
  v_photographer_share := ROUND(v_net_amount * p_photographer_pct / 100, 2);

  -- Calcular share de director
  v_director_share := ROUND(v_net_amount * p_director_pct / 100, 2);

  -- Retornar breakdown completo
  RETURN jsonb_build_object(
    'gross_amount', p_gross_amount,
    'gateway_fee', p_gateway_fee,
    'net_amount', v_net_amount,
    'photographer_share', v_photographer_share,
    'director_share', v_director_share,
    'photographer_percentage', p_photographer_pct,
    'director_percentage', p_director_pct
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_earnings_breakdown IS 'Calcula la distribución de ganancias entre fotógrafo y director después de comisión de pasarela.';

-- ============================================================================
-- PASO 7: Vistas SQL para reportes
-- ============================================================================

-- Vista: Ganancias pendientes de distribuir
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
ORDER BY pr.created_at DESC;

COMMENT ON VIEW pending_earnings IS 'Ganancias pendientes de pago a fotógrafos y director.';

-- Vista: Resumen de ganancias por fotógrafo
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
GROUP BY p.id, p.name, p.email, p.active
ORDER BY pending_amount DESC NULLS LAST;

COMMENT ON VIEW photographer_earnings_summary IS 'Resumen de ganancias por fotógrafo: total, pagado, pendiente.';

-- Vista: Resumen de ganancias del director
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
  AND pr.transaction_details IS NOT NULL;

COMMENT ON VIEW director_earnings_summary IS 'Resumen de ganancias totales del director de la academia.';

-- Vista: Detalle de liquidaciones
CREATE OR REPLACE VIEW settlements_detail AS
SELECT
  s.id as settlement_id,
  s.settlement_date,
  s.period_start,
  s.period_end,
  s.recipient_type,
  s.recipient_id,
  s.recipient_name,
  s.total_amount,
  ARRAY_LENGTH(s.photo_request_ids, 1) as requests_count,
  s.payment_method,
  s.payment_proof_url,
  s.status,
  s.notes,
  s.created_by,
  s.created_at,
  -- Calcular total de fotos en esta liquidación
  (
    SELECT SUM(ARRAY_LENGTH(pr.photo_ids, 1))
    FROM photo_requests pr
    WHERE pr.id = ANY(s.photo_request_ids)
  ) as total_photos
FROM settlements s
ORDER BY s.settlement_date DESC, s.created_at DESC;

COMMENT ON VIEW settlements_detail IS 'Detalle completo de todas las liquidaciones realizadas.';

-- Vista: Historial de ajustes
CREATE OR REPLACE VIEW adjustments_history AS
SELECT
  a.id as adjustment_id,
  a.photo_request_id,
  pr.client_name,
  g.title as gallery_title,
  a.adjustment_type,
  a.amount,
  a.affects_photographer,
  a.affects_director,
  a.reason,
  a.created_by,
  a.created_at
FROM adjustments a
JOIN photo_requests pr ON pr.id = a.photo_request_id
JOIN galleries g ON g.id = pr.gallery_id
ORDER BY a.created_at DESC;

COMMENT ON VIEW adjustments_history IS 'Historial completo de ajustes manuales realizados.';

-- ============================================================================
-- PASO 8: Función para migrar datos existentes
-- ============================================================================

-- Esta función actualiza las solicitudes existentes que ya tienen pago
-- para agregarles el transaction_details basado en el precio actual
CREATE OR REPLACE FUNCTION migrate_existing_paid_requests()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_default_price INTEGER;
  v_default_photographer_pct NUMERIC;
  v_default_director_pct NUMERIC;
  v_default_gateway_pct NUMERIC;
  v_count INTEGER := 0;
  v_request RECORD;
  v_photo_count INTEGER;
  v_gross_amount NUMERIC;
  v_gateway_fee NUMERIC;
  v_breakdown JSONB;
BEGIN
  -- Obtener valores por defecto (ajustar según tus variables de entorno)
  v_default_price := 2000;
  v_default_photographer_pct := 80;
  v_default_director_pct := 20;
  v_default_gateway_pct := 3.5;

  -- Iterar sobre solicitudes pagadas sin transaction_details
  FOR v_request IN
    SELECT id, photo_ids, gallery_id
    FROM photo_requests
    WHERE status IN ('paid', 'delivered', 'expired')
      AND transaction_details IS NULL
  LOOP
    -- Contar fotos
    v_photo_count := ARRAY_LENGTH(v_request.photo_ids, 1);

    IF v_photo_count IS NULL OR v_photo_count = 0 THEN
      CONTINUE;
    END IF;

    -- Calcular monto bruto
    v_gross_amount := v_photo_count * v_default_price;

    -- Estimar comisión de pasarela (no tenemos la real)
    v_gateway_fee := ROUND(v_gross_amount * v_default_gateway_pct / 100, 2);

    -- Calcular breakdown
    v_breakdown := calculate_earnings_breakdown(
      v_gross_amount,
      v_gateway_fee,
      v_default_photographer_pct,
      v_default_director_pct
    );

    -- Actualizar solicitud
    UPDATE photo_requests
    SET
      price_per_photo = v_default_price,
      transaction_details = jsonb_build_object(
        'gross_amount', v_gross_amount,
        'gateway_fee', v_gateway_fee,
        'gateway_fee_estimated', true, -- Marcar como estimado
        'net_amount', v_breakdown->'net_amount',
        'breakdown', v_breakdown,
        'migrated_at', NOW()
      ),
      settlement_status = 'pending'
    WHERE id = v_request.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_existing_paid_requests IS 'Migra solicitudes existentes agregando transaction_details estimados. EJECUTAR UNA SOLA VEZ.';

-- ============================================================================
-- PASO 9: Triggers para mantener updated_at
-- ============================================================================

-- Trigger para photographers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photographers_updated_at
  BEFORE UPDATE ON photographers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PASO 10: Datos iniciales de ejemplo (OPCIONAL)
-- ============================================================================

-- Insertar director como fotógrafo (si aplica)
-- INSERT INTO photographers (name, email, active, notes)
-- VALUES ('Director Academia', 'director@diablosrojoscl.com', true, 'Director de la academia')
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- PASO 11: Verificación
-- ============================================================================

-- Verificar estructura
SELECT
  'photographers' as table_name,
  COUNT(*) as row_count
FROM photographers
UNION ALL
SELECT 'galleries_with_photographer', COUNT(*)
FROM galleries WHERE photographer_id IS NOT NULL
UNION ALL
SELECT 'photo_requests_with_transaction_details', COUNT(*)
FROM photo_requests WHERE transaction_details IS NOT NULL
UNION ALL
SELECT 'settlements', COUNT(*)
FROM settlements
UNION ALL
SELECT 'adjustments', COUNT(*)
FROM adjustments;

-- Ver ganancias pendientes
-- SELECT * FROM pending_earnings LIMIT 5;

-- Ver resumen por fotógrafo
-- SELECT * FROM photographer_earnings_summary;

-- Ver resumen director
-- SELECT * FROM director_earnings_summary;

-- ============================================================================
-- NOTAS FINALES
-- ============================================================================

-- IMPORTANTE: Después de ejecutar esta migración:
--
-- 1. Ejecutar migrate_existing_paid_requests() UNA SOLA VEZ para migrar datos:
--    SELECT migrate_existing_paid_requests();
--
-- 2. Configurar variables de entorno en Vercel:
--    - PRICE_PER_PHOTO=2000
--    - DEFAULT_PHOTOGRAPHER_PERCENTAGE=80
--    - DEFAULT_DIRECTOR_PERCENTAGE=20
--    - DEFAULT_PAYMENT_GATEWAY_FEE_PERCENTAGE=3.5
--
-- 3. Actualizar webhook de Flow para capturar comisión real
--
-- 4. Crear fotógrafos en la tabla photographers
--
-- 5. Asignar fotógrafos a galerías existentes si es necesario
--
-- Estados del sistema:
-- - photo_requests.settlement_status: pending → partial → settled
-- - settlements.status: pending → paid | cancelled
--
-- Flujo de trabajo:
-- 1. Cliente paga → Se guarda transaction_details con breakdown
-- 2. Generar liquidación para fotógrafo/director por período
-- 3. Realizar pago y marcar settlement como 'paid'
-- 4. Actualizar photo_requests incluidas a settlement_status='settled'

# Análisis Crítico: Sistema de Distribución de Ganancias

## 1. Situación Actual vs. Situación Propuesta

### Problemas Identificados

#### 1.1 Comisión de Flow Variable
**Problema**: La comisión de Flow NO es fija. Depende de:
- Tipo de tarjeta (crédito/débito)
- Banco emisor
- Método de pago
- Montos

**Solución**: Capturar la comisión REAL del webhook de Flow en cada transacción.

#### 1.2 Configuración Rígida
**Problema**: Porcentajes fijos para todas las galerías
- ¿Qué pasa si el acuerdo cambia con el tiempo?
- ¿Qué pasa si diferentes eventos tienen diferentes fotógrafos?
- ¿Qué pasa si hay eventos especiales con otros porcentajes?

**Solución**: Configuración por galería con herencia de defaults globales.

#### 1.3 Sin Trazabilidad de Pagos
**Problema**: No hay forma de rastrear:
- ¿Cuánto se le debe pagar al director?
- ¿Cuánto se le debe pagar al fotógrafo?
- ¿Ya se realizó el pago?
- ¿Cuándo se pagó?
- ¿Hay un comprobante?

**Solución**: Sistema de liquidaciones (settlements) con estados y tracking.

#### 1.4 Historial No Inmutable
**Problema**: Si cambias los porcentajes, ¿cómo calculas las ganancias pasadas?

**Solución**: Guardar la configuración de comisiones con cada transacción (snapshot).

#### 1.5 Casos Especiales No Contemplados
**Problema**: El sistema no maneja:
- Reembolsos (¿cómo afectan las ganancias?)
- Descuentos o promociones
- Fotos gratuitas
- Cancelaciones después del pago

**Solución**: Estados de transacción y ajustes manuales rastreables.

---

## 2. Propuesta de Arquitectura

### 2.1 Modelo de Datos

```
photographers (nueva tabla)
├── id
├── name
├── email
├── phone
├── rut (opcional)
├── bank_account_info (JSONB - cifrado)
├── tax_id_type (boleta/factura)
├── created_at
└── active

galleries (tabla existente - agregar campos)
├── ... (campos existentes)
├── photographer_id → photographers(id)
├── commission_config (JSONB)
│   ├── photographer_percentage
│   ├── director_percentage
│   ├── payment_gateway_fee_percentage
│   └── created_at (timestamp del config)
└── commission_notes (texto libre)

photo_requests (tabla existente - agregar campos)
├── ... (campos existentes)
├── price_per_photo (snapshot del precio al momento de la solicitud)
├── transaction_details (JSONB)
│   ├── gross_amount (precio total)
│   ├── payment_gateway_fee (comisión real de Flow)
│   ├── net_amount (lo que realmente se recibe)
│   ├── commission_snapshot (config de comisiones vigente)
│   └── breakdown (distribución calculada)
├── settlement_status (pending/partial/settled)
└── settlement_notes

settlements (nueva tabla - liquidaciones/pagos)
├── id
├── settlement_date
├── period_start
├── period_end
├── recipient_type (photographer/director)
├── recipient_id (photographer_id o director_id)
├── total_amount
├── photo_requests_ids (array de IDs)
├── payment_method (transferencia/efectivo/etc)
├── payment_proof_url (comprobante)
├── status (pending/paid/cancelled)
├── notes
├── created_by (admin user)
└── created_at

adjustments (nueva tabla - ajustes manuales)
├── id
├── photo_request_id
├── adjustment_type (refund/discount/bonus/correction)
├── amount
├── affects_photographer (boolean)
├── affects_director (boolean)
├── reason
├── created_by
└── created_at
```

### 2.2 Variables de Entorno (Defaults Globales)

```env
# Pricing
PRICE_PER_PHOTO=2000

# Commission Defaults (se pueden override por galería)
DEFAULT_PHOTOGRAPHER_PERCENTAGE=80
DEFAULT_DIRECTOR_PERCENTAGE=20
DEFAULT_PAYMENT_GATEWAY_FEE_PERCENTAGE=3.5

# Director Info
DIRECTOR_NAME="Juan Pérez"
DIRECTOR_EMAIL="director@diablosrojoscl.com"
DIRECTOR_BANK_ACCOUNT_INFO_ENCRYPTED=""

# Tax Settings
TAX_RETENTION_PERCENTAGE=0  # Si aplica retención de honorarios
```

### 2.3 Flujo de Datos

#### Al crear una galería:
1. Asignar fotógrafo
2. Heredar commission_config de defaults (editable)
3. Guardar snapshot de configuración

#### Al recibir pago (webhook Flow):
1. Capturar comisión REAL del webhook
2. Guardar price_per_photo actual
3. Guardar commission_snapshot de la galería
4. Calcular distribución:
   ```
   gross_amount = photo_count * price_per_photo
   gateway_fee = datos del webhook (REAL)
   net_amount = gross_amount - gateway_fee

   photographer_share = net_amount * photographer_percentage / 100
   director_share = net_amount * director_percentage / 100
   ```
5. Guardar en transaction_details

#### Al hacer corte de caja:
1. Seleccionar período
2. Seleccionar recipient (fotógrafo o director)
3. Ver todas las solicitudes pending/partial
4. Generar liquidación con IDs de solicitudes
5. Marcar como paid cuando se transfiere
6. Adjuntar comprobante

---

## 3. Reportes Necesarios

### 3.1 Vista: Ganancias por Distribuir
```sql
CREATE VIEW pending_earnings AS
SELECT
  pr.id,
  g.title,
  p.name as photographer_name,
  pr.transaction_details->>'net_amount' as net_amount,
  pr.transaction_details->'breakdown'->>'photographer_share' as photographer_pending,
  pr.transaction_details->'breakdown'->>'director_share' as director_pending,
  pr.settlement_status,
  pr.created_at
FROM photo_requests pr
JOIN galleries g ON pr.gallery_id = g.id
LEFT JOIN photographers p ON g.photographer_id = p.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
  AND pr.settlement_status != 'settled';
```

### 3.2 Vista: Resumen por Fotógrafo
```sql
CREATE VIEW photographer_earnings_summary AS
SELECT
  p.id,
  p.name,
  COUNT(DISTINCT pr.id) as total_requests,
  SUM((pr.transaction_details->'breakdown'->>'photographer_share')::numeric) as total_earnings,
  SUM(CASE WHEN pr.settlement_status = 'settled' THEN (pr.transaction_details->'breakdown'->>'photographer_share')::numeric ELSE 0 END) as paid_amount,
  SUM(CASE WHEN pr.settlement_status != 'settled' THEN (pr.transaction_details->'breakdown'->>'photographer_share')::numeric ELSE 0 END) as pending_amount
FROM photographers p
LEFT JOIN galleries g ON g.photographer_id = p.id
LEFT JOIN photo_requests pr ON pr.gallery_id = g.id
WHERE pr.status IN ('paid', 'delivered', 'expired')
GROUP BY p.id, p.name;
```

### 3.3 Vista: Resumen para Director
```sql
CREATE VIEW director_earnings_summary AS
SELECT
  COUNT(DISTINCT pr.id) as total_requests,
  SUM((pr.transaction_details->'breakdown'->>'director_share')::numeric) as total_earnings,
  SUM(CASE WHEN pr.settlement_status = 'settled' THEN (pr.transaction_details->'breakdown'->>'director_share')::numeric ELSE 0 END) as paid_amount,
  SUM(CASE WHEN pr.settlement_status != 'settled' THEN (pr.transaction_details->'breakdown'->>'director_share')::numeric ELSE 0 END) as pending_amount
FROM photo_requests pr
WHERE pr.status IN ('paid', 'delivered', 'expired');
```

---

## 4. Casos de Uso

### 4.1 Corte de Caja Mensual
```
1. Ir a /admin/liquidaciones
2. Seleccionar período: 01/01/2026 - 31/01/2026
3. Ver reporte de ganancias pendientes
4. Generar liquidación para "Juan Fotógrafo"
   - Total: $150.000 CLP
   - Solicitudes: 15
   - Método: Transferencia bancaria
5. Realizar transferencia
6. Subir comprobante
7. Marcar como "Pagada"
8. Repetir para director
```

### 4.2 Cambio de Fotógrafo
```
1. Crear nuevo evento/galería
2. Seleccionar fotógrafo diferente
3. Ajustar porcentajes si es necesario (override)
4. Las ganancias se asignan automáticamente al fotógrafo correcto
```

### 4.3 Reembolso
```
1. Cliente solicita reembolso
2. Crear ajuste manual:
   - Tipo: refund
   - Monto: -$10.000
   - Afecta: Fotógrafo + Director (proporcional)
   - Razón: "Cliente insatisfecho"
3. El sistema recalcula ganancias pendientes
```

### 4.4 Auditoría Transparente
```
1. Fotógrafo solicita ver sus ganancias
2. Generar reporte con:
   - Todas las solicitudes pagadas
   - Desglose por transacción
   - Comisión de Flow (real)
   - Porcentaje aplicado
   - Total ganado
   - Total pagado
   - Total pendiente
3. Exportar a PDF/Excel
```

---

## 5. Preguntas Críticas para el Usuario

### 5.1 Fiscalización
- ¿El fotógrafo emite boleta de honorarios?
- ¿Hay retención de impuestos (10% honorarios)?
- ¿El director también?
- ¿Se necesita generar documentos tributarios automáticos?

### 5.2 Múltiples Participantes
- ¿Puede un evento tener varios fotógrafos?
- Si es así, ¿cómo se divide el porcentaje?
- ¿Hay otros roles? (editor, asistente, etc.)

### 5.3 Frecuencia de Pagos
- ¿Cada cuánto se paga? (semanal/mensual/por evento)
- ¿Hay un mínimo para pagar?
- ¿Se puede pagar parcialmente?

### 5.4 Casos Especiales
- ¿Hay descuentos grupales?
- ¿Hay fotos gratuitas/cortesía?
- ¿Los reembolsos afectan las ganancias?
- ¿Qué pasa si Flow cobra más/menos de lo esperado?

---

## 6. Ventajas de esta Propuesta

### ✅ Transparencia Total
- Cada transacción tiene desglose completo
- Histórico inmutable
- Reportes auditables

### ✅ Escalabilidad
- Agregar nuevos fotógrafos: ✅
- Cambiar porcentajes: ✅
- Múltiples fotógrafos por evento: ✅
- Nuevos roles (editor, asistente): ✅

### ✅ Flexibilidad
- Porcentajes por galería
- Ajustes manuales rastreables
- Diferentes acuerdos para diferentes eventos

### ✅ Trazabilidad
- ¿Cuánto se debe? → Query a pending_earnings
- ¿Ya se pagó? → Ver settlements
- ¿Cuándo? → settlement_date
- ¿Comprobante? → payment_proof_url

### ✅ Confiabilidad
- Usa comisión REAL de Flow (no estimada)
- Snapshots inmutables de configuración
- Estados de liquidación claros

---

## 7. Implementación Recomendada

### Fase 1: Fundamentos (Semana 1)
- [ ] Crear tabla photographers
- [ ] Actualizar galleries con photographer_id y commission_config
- [ ] Actualizar photo_requests con transaction_details
- [ ] Variables de entorno para defaults

### Fase 2: Tracking de Transacciones (Semana 2)
- [ ] Modificar webhook de Flow para capturar comisión real
- [ ] Guardar snapshots de precio y comisiones
- [ ] Calcular distribución automática
- [ ] Vistas SQL para reportes

### Fase 3: Sistema de Liquidaciones (Semana 3)
- [ ] Crear tabla settlements
- [ ] Interfaz para generar liquidaciones
- [ ] Subir comprobantes
- [ ] Reportes de ganancias por distribuir

### Fase 4: Ajustes y Auditoría (Semana 4)
- [ ] Tabla adjustments
- [ ] Reportes exportables (PDF/Excel)
- [ ] Dashboard de ganancias
- [ ] Sistema de notificaciones

---

## 8. Recomendación Final

**NO implementes campos sueltos.** Implementa el sistema completo de liquidaciones para:

1. **Claridad**: Cada peso está rastreado desde el cliente hasta el fotógrafo/director
2. **Escalabilidad**: Puede crecer con el negocio
3. **Confianza**: Reportes transparentes y auditables
4. **Legalidad**: Preparado para requerimientos fiscales

¿Quieres que implemente esta solución completa o prefieres empezar con una versión simplificada?

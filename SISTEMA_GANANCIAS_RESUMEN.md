# Sistema de Distribución de Ganancias - Resumen Ejecutivo

## ✅ Lo que se ha implementado

### 1. Análisis Crítico Completo
📄 **Archivo**: `ANALISIS_SISTEMA_GANANCIAS.md`

He realizado un análisis exhaustivo identificando:
- **Problemas de la propuesta inicial**: Comisión variable, falta de trazabilidad, casos especiales no contemplados
- **Solución arquitectónica completa**: Escalable, transparente, auditable
- **Modelo de datos robusto**: 5 tablas + 5 vistas SQL
- **Casos de uso documentados**: Cortes de caja, reembolsos, cambios de fotógrafo, auditorías

### 2. Migración SQL Completa
📄 **Archivo**: `supabase-earnings-system.sql`

**Nuevas tablas**:
- `photographers`: Fotógrafos con información bancaria y tributaria
- `settlements`: Liquidaciones/pagos a fotógrafos y director
- `adjustments`: Ajustes manuales (reembolsos, descuentos, bonos)

**Tablas actualizadas**:
- `galleries`: +photographer_id, +commission_config, +commission_notes
- `photo_requests`: +price_per_photo, +transaction_details, +settlement_status, +settlement_notes

**Vistas SQL para reportes**:
- `pending_earnings`: Ganancias pendientes de distribuir
- `photographer_earnings_summary`: Resumen por fotógrafo (total, pagado, pendiente)
- `director_earnings_summary`: Resumen del director
- `settlements_detail`: Detalle de liquidaciones
- `adjustments_history`: Historial de ajustes

**Funciones**:
- `calculate_earnings_breakdown()`: Calcula distribución de ganancias
- `migrate_existing_paid_requests()`: Migra datos existentes (ejecutar UNA vez)
- `update_updated_at()`: Trigger automático para timestamps

### 3. Lógica de Cálculos
📄 **Archivo**: `lib/earningsCalculations.ts`

**Funciones implementadas**:
- `getDefaultCommissionConfig()`: Obtiene config desde variables de entorno
- `calculateEarningsBreakdown()`: Calcula distribución (fotógrafo + director)
- `createTransactionDetails()`: Crea detalles completos de transacción
- `validateCommissionConfig()`: Valida que porcentajes sumen 100%
- `calculatePendingEarnings()`: Calcula total pendiente de pago

**TypeScript Interfaces**:
```typescript
interface CommissionConfig {
  photographer_percentage: number;      // Ej: 80
  director_percentage: number;          // Ej: 20
  payment_gateway_fee_percentage: number; // Ej: 3.5
}

interface TransactionDetails {
  gross_amount: number;          // Monto total
  gateway_fee: number;           // Comisión real de Flow
  gateway_fee_estimated: boolean; // Si fue estimada o real
  net_amount: number;            // Después de comisión
  photographer_share: number;    // Para el fotógrafo
  director_share: number;        // Para el director
  photographer_percentage: number;
  director_percentage: number;
  price_per_photo: number;
  photo_count: number;
  flow_order?: number;
  commission_snapshot: CommissionConfig; // Config vigente
}
```

### 4. Webhook de Flow Mejorado
📄 **Archivo**: `app/api/webhooks/flow/route.ts`

**Mejoras implementadas**:
1. **Captura comisión real**: Extrae `fee` del paymentStatus de Flow
2. **Config por galería**: Obtiene commission_config específico de cada galería
3. **Snapshot de precio**: Guarda price_per_photo vigente al momento del pago
4. **Cálculo automático**: Usa `createTransactionDetails()` para calcular distribución
5. **Persistencia completa**: Guarda todo en `transaction_details` (JSONB inmutable)
6. **Email mejorado**: Notificación al admin incluye desglose financiero completo

**Ejemplo de email al admin**:
```
Desglose Financiero
┌──────────────────────┬───────────┐
│ Monto Total:         │ $10,000   │
│ Comisión Flow:       │ -$350     │
│ Monto Neto:          │ $9,650    │
│ Fotógrafo (80%):     │ $7,720    │
│ Director (20%):      │ $1,930    │
└──────────────────────┴───────────┘
```

### 5. Variables de Entorno
📄 **Archivo**: `.env.local.example`

**Nuevas variables documentadas**:
```env
# Pricing
PRICE_PER_PHOTO=2000

# Earnings Distribution
DEFAULT_PHOTOGRAPHER_PERCENTAGE=80
DEFAULT_DIRECTOR_PERCENTAGE=20
DEFAULT_PAYMENT_GATEWAY_FEE_PERCENTAGE=3.5

# Director Info
DIRECTOR_NAME=Director Academia
DIRECTOR_EMAIL=director@diablosrojoscl.com
```

---

## 🎯 Características del Sistema

### ✅ Transparencia Total
- Cada transacción tiene desglose completo visible
- Histórico inmutable (snapshots de precios y comisiones)
- Reportes auditables con vistas SQL optimizadas

### ✅ Escalabilidad
- ✅ Agregar nuevos fotógrafos
- ✅ Cambiar porcentajes por galería
- ✅ Múltiples fotógrafos en diferentes eventos
- ✅ Nuevos roles futuros (editor, asistente, etc.)
- ✅ Ajustes manuales rastreables

### ✅ Flexibilidad
- Porcentajes configurables por galería (override de defaults)
- Ajustes manuales para casos especiales
- Diferentes acuerdos para diferentes eventos

### ✅ Trazabilidad
- ¿Cuánto se debe? → `SELECT * FROM pending_earnings`
- ¿Ya se pagó? → `SELECT * FROM settlements WHERE status='paid'`
- ¿Cuándo? → settlement_date
- ¿Comprobante? → payment_proof_url

### ✅ Confiabilidad
- Usa comisión REAL de Flow (campo `fee`)
- Snapshots inmutables de configuración
- Estados claros: pending → partial → settled

---

## 📋 Próximos Pasos - Para el Usuario

### 1. Ejecutar Migraciones SQL (REQUERIDO)

```sql
-- Paso 1: Ejecutar en Supabase SQL Editor
-- Copiar y pegar TODO el contenido de: supabase-earnings-system.sql

-- Paso 2: Migrar datos existentes (EJECUTAR UNA SOLA VEZ)
SELECT migrate_existing_paid_requests();

-- Paso 3: Verificar que se crearon las tablas
SELECT * FROM photographers LIMIT 1;
SELECT * FROM pending_earnings LIMIT 5;
```

### 2. Configurar Variables de Entorno en Vercel

Agregar en **Vercel Dashboard → Settings → Environment Variables**:
```
DEFAULT_PHOTOGRAPHER_PERCENTAGE=80
DEFAULT_DIRECTOR_PERCENTAGE=20
DEFAULT_PAYMENT_GATEWAY_FEE_PERCENTAGE=3.5
DIRECTOR_NAME=Tu Nombre
DIRECTOR_EMAIL=tu@email.com
```

### 3. Crear Fotógrafos en la Base de Datos

```sql
-- Ejemplo: Crear fotógrafo
INSERT INTO photographers (name, email, phone, rut, active)
VALUES ('Juan Fotógrafo', 'juan@example.com', '+56912345678', '12345678-9', true);

-- Obtener ID del fotógrafo
SELECT id, name FROM photographers;
```

### 4. Asignar Fotógrafos a Galerías (Opcional)

```sql
-- Asignar fotógrafo a galería específica
UPDATE galleries
SET photographer_id = 'uuid-del-fotografo-aqui'
WHERE id = 'uuid-de-la-galeria';

-- Configurar porcentajes especiales para una galería (override)
UPDATE galleries
SET commission_config = '{
  "photographer_percentage": 70,
  "director_percentage": 30,
  "payment_gateway_fee_percentage": 3.5
}'::jsonb
WHERE id = 'uuid-de-la-galeria';
```

---

## 🚀 Lo que falta por implementar (Fase 2)

### A. Interfaz de Administración de Fotógrafos
- Página `/admin/fotografos`
- CRUD de fotógrafos
- Asignar fotógrafo a galerías desde UI
- Ver historial de ganancias por fotógrafo

### B. Sistema de Liquidaciones
- Página `/admin/liquidaciones`
- Generar liquidación por período
- Seleccionar solicitudes a incluir
- Subir comprobante de pago
- Marcar como pagada
- Exportar reporte PDF/Excel

### C. Dashboard de Ganancias
- Página `/admin/ganancias`
- Gráfico de ingresos por mes
- Resumen de pendientes por distribuir
- Comparación fotógrafo vs director
- Filtros por fechas, fotógrafo, estado

### D. Exportación de Reportes
- Reporte de ganancias por fotógrafo (Excel/PDF)
- Reporte de liquidaciones (para el director)
- Comprobantes de pago individuales

---

## 💡 Ventajas sobre la Propuesta Inicial

| Aspecto | Propuesta Inicial | Solución Implementada |
|---------|-------------------|----------------------|
| **Comisión Flow** | Simulada (2.89%) | Capturada REAL del webhook |
| **Configuración** | Global fija | Por galería con defaults |
| **Trazabilidad** | ❌ Ninguna | ✅ Completa con settlements |
| **Histórico** | ❌ Mutable | ✅ Inmutable (snapshots) |
| **Casos especiales** | ❌ No contemplados | ✅ Ajustes manuales rastreables |
| **Escalabilidad** | ❌ Rígido | ✅ Flexible y extensible |
| **Auditoría** | ❌ Imposible | ✅ Vistas SQL + reportes |
| **Múltiples fotógrafos** | ❌ No soportado | ✅ Tabla dedicada |
| **Reembolsos** | ❌ No considerado | ✅ Tabla adjustments |

---

## 🎓 Cómo Funciona - Flujo Completo

### 1. Cliente realiza pago
```
Cliente paga → Flow procesa → Webhook recibe confirmación
```

### 2. Sistema captura información (AUTOMÁTICO)
```typescript
// El webhook automáticamente:
1. Obtiene commission_config de la galería
2. Captura fee REAL de Flow (si disponible)
3. Calcula distribución:
   - Monto total: $10,000
   - Comisión Flow: -$350 (3.5%)
   - Neto: $9,650
   - Fotógrafo (80%): $7,720
   - Director (20%): $1,930
4. Guarda en transaction_details (INMUTABLE)
5. Marca settlement_status = 'pending'
```

### 3. Consultar ganancias pendientes
```sql
-- Ver todas las ganancias pendientes
SELECT * FROM pending_earnings;

-- Resumen por fotógrafo
SELECT * FROM photographer_earnings_summary;

-- Resumen director
SELECT * FROM director_earnings_summary;
```

### 4. Hacer corte de caja (FUTURO - Interfaz)
```
1. Ir a /admin/liquidaciones
2. Seleccionar período: 01/01/2026 - 31/01/2026
3. Seleccionar destinatario: Juan Fotógrafo
4. Ver listado de solicitudes pendientes: $50,000
5. Generar liquidación
6. Realizar transferencia bancaria
7. Subir comprobante
8. Marcar como "Pagada"
9. Sistema actualiza settlement_status de solicitudes a 'settled'
```

---

## ❓ Preguntas Pendientes

Para completar el sistema, necesito que respondas:

### 1. Fiscalización
- ¿El fotógrafo emite **boleta de honorarios**?
- ¿Hay **retención de impuestos** (10% honorarios en Chile)?
- ¿El director también debe emitir documento tributario?
- ¿Necesitas generar estos documentos automáticamente?

### 2. Múltiples Participantes
- ¿Puede un evento tener **varios fotógrafos**?
- Si es así, ¿cómo se divide el porcentaje entre ellos?
- ¿Hay otros roles que deben recibir pago? (editor, asistente, coordinador)

### 3. Frecuencia de Pagos
- ¿Cada cuánto tiempo se paga? (semanal/quincenal/mensual/por evento)
- ¿Hay un **mínimo** para hacer transferencia?
- ¿Se permite **pago parcial** de ganancias?

### 4. Casos Especiales
- ¿Hay **descuentos grupales** o promociones?
- ¿Existen **fotos gratuitas** o cortesía?
- ¿Los **reembolsos** afectan las ganancias del fotógrafo/director?
- ¿Qué pasa si Flow cobra diferente a lo esperado?

---

## 📊 Estado Actual del Proyecto

### ✅ Completado (Backend + Lógica)
- [x] Análisis crítico y diseño arquitectónico
- [x] Migraciones SQL completas
- [x] Tablas: photographers, settlements, adjustments
- [x] Vistas SQL para reportes
- [x] Librería de cálculos (earningsCalculations.ts)
- [x] Webhook de Flow actualizado
- [x] Captura de comisión real
- [x] Snapshots inmutables
- [x] Variables de entorno documentadas

### ⏳ Pendiente (Frontend + UX)
- [ ] Interfaz de administración de fotógrafos
- [ ] Sistema de liquidaciones UI
- [ ] Dashboard de ganancias
- [ ] Exportación de reportes
- [ ] Subida de comprobantes de pago
- [ ] Notificaciones a fotógrafos cuando hay liquidaciones

---

## 🎯 Siguiente Sesión - Opciones

**Opción A: Implementar interfaz completa de liquidaciones**
- Crear `/admin/liquidaciones`
- Generar liquidaciones por período
- Marcar como pagadas
- Ver historial

**Opción B: Implementar administración de fotógrafos**
- Crear `/admin/fotografos`
- CRUD de fotógrafos
- Asignar a galerías
- Ver ganancias individuales

**Opción C: Dashboard de ganancias**
- Crear `/admin/ganancias`
- Gráficos de ingresos
- Comparativas
- Exportar reportes

**¿Cuál prefieres que implemente primero?**

---

## 📞 Soporte y Documentación

- **Análisis completo**: `ANALISIS_SISTEMA_GANANCIAS.md`
- **Migración SQL**: `supabase-earnings-system.sql`
- **Lógica de cálculos**: `lib/earningsCalculations.ts`
- **Webhook actualizado**: `app/api/webhooks/flow/route.ts`

Si tienes dudas sobre cualquier aspecto del sistema, puedo explicarte en detalle cómo funciona cada parte.

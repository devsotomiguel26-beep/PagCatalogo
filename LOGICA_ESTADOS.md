# 📊 LÓGICA DE ESTADOS - Sistema de Solicitudes de Fotos

## ✅ RESUMEN EJECUTIVO

**Los estados SÍ reflejan la realidad**:
- `pending`: No ha pagado
- `paid`: Pagó PERO fotos aún no enviadas (dura 1-2 segundos en webhook)
- `delivered`: Pagó Y fotos enviadas exitosamente
- `expired`: Fotos enviadas pero enlaces expiraron (7 días)

**Campo clave**: `photos_sent_at`
- Si es NULL → Fotos NO enviadas
- Si tiene fecha → Fotos enviadas (+ status debe ser `delivered`)

---

## 🔄 FLUJO COMPLETO

### Caso 1: Pago exitoso vía Webhook (AUTOMÁTICO)

```
Usuario crea solicitud
    ↓
status = 'pending'
photos_sent_at = NULL
    ↓
Usuario paga en Flow
    ↓
Webhook recibe confirmación
    ↓
status = 'paid' (temporal, ~1 segundo)
flow_order = 157331211
payment_data = {...}
    ↓
Sistema genera links de descarga
    ↓
Sistema envía email al cliente
    ↓
markPhotosAsSent() ejecuta
    ↓
status = 'delivered' ✅
photos_sent_at = NOW()
download_links_expires_at = NOW() + 7 días
    ↓
[7 días después - cronjob]
    ↓
status = 'expired'
```

**Duración en cada estado**:
- `pending`: Desde creación hasta pago (horas/días)
- `paid`: ~1-2 segundos (solo mientras se envía email)
- `delivered`: 7 días (hasta que expiran los links)
- `expired`: Permanente (hasta reenvío)

### Caso 2: Envío manual (sin webhook)

```
Usuario crea solicitud
    ↓
status = 'pending'
    ↓
Admin hace click "Enviar fotos"
    ↓
Sistema genera links
    ↓
Sistema envía email
    ↓
status = 'delivered' ✅
photos_sent_at = NOW()
download_links_expires_at = NOW() + 7 días
```

**Nota**: En este caso NO hay pago registrado (no hay flow_order).

### Caso 3: Reenvío de fotos

```
status = 'delivered' o 'expired'
    ↓
Admin hace click "Reenviar fotos"
    ↓
Sistema regenera links
    ↓
Sistema envía email
    ↓
status = 'delivered' ✅ (actualizado)
photos_sent_at = NOW() (actualizado)
download_links_expires_at = NOW() + 7 días (nuevo)
```

---

## 📋 MATRIZ DE ESTADOS

| Status | photos_sent_at | flow_order | Significado | Acción disponible |
|--------|----------------|------------|-------------|-------------------|
| `pending` | NULL | NULL | No ha pagado | Esperar pago |
| `pending` | NULL | ✅ | Pagó pero webhook falló | ⚠️ ERROR - Investigar |
| `paid` | NULL | ✅ | Pagó, enviando fotos... | Normal (dura segundos) |
| `paid` | ✅ | ✅ | ⚠️ INCONSISTENCIA | Debería ser `delivered` |
| `delivered` | ✅ | ✅ | Pagó + fotos enviadas | Todo correcto ✅ |
| `delivered` | ✅ | NULL | Fotos enviadas sin pago | Envío manual (OK) |
| `expired` | ✅ | ✅/NULL | Enlaces vencidos | Reenviar fotos |

---

## 🎯 VALIDACIONES RECOMENDADAS

### Script de verificación de integridad

```javascript
// Detectar inconsistencias
SELECT
  id,
  client_name,
  status,
  photos_sent_at,
  flow_order,
  CASE
    -- Fotos enviadas pero status no es delivered/expired
    WHEN photos_sent_at IS NOT NULL
         AND status NOT IN ('delivered', 'expired')
    THEN 'ERROR: Fotos enviadas pero status incorrecto'

    -- Status delivered pero fotos no enviadas
    WHEN status IN ('delivered', 'expired')
         AND photos_sent_at IS NULL
    THEN 'ERROR: Status dice entregado pero no hay fecha de envío'

    -- Tiene flow_order pero status pending
    WHEN flow_order IS NOT NULL
         AND status = 'pending'
    THEN 'WARNING: Tiene pago pero status pendiente'

    ELSE 'OK'
  END as validation
FROM photo_requests
WHERE validation != 'OK';
```

### Cronjob diario: Detectar enlaces expirados

```javascript
// Ejecutar diariamente a las 00:00
UPDATE photo_requests
SET status = 'expired'
WHERE status = 'delivered'
  AND download_links_expires_at < NOW()
  AND photos_sent_at IS NOT NULL;
```

---

## 🔍 CÓMO INTERPRETAR CADA ESTADO

### 🟡 `pending` - Esperando Pago

**Qué significa**:
- Cliente seleccionó fotos
- NO ha completado el pago en Flow
- O pagó pero webhook NO se ejecutó

**Qué hacer**:
1. Verificar en Flow Dashboard si hay pago
2. Si HAY pago: Webhook falló → actualizar manualmente
3. Si NO hay pago: Esperar o contactar al cliente

**Verificar integridad**:
- `flow_order` debe ser NULL
- `payment_data` debe ser NULL
- `photos_sent_at` debe ser NULL

**Si tiene flow_order**: ⚠️ PROBLEMA - Webhook falló

---

### 💰 `paid` - Pago Confirmado (Temporal)

**Qué significa**:
- Pago confirmado por Flow
- Sistema está generando links y enviando email
- **Dura solo 1-2 segundos**

**Qué hacer**:
- **Nada** - Es un estado transitorio
- Se convertirá automáticamente en `delivered`

**Verificar integridad**:
- `flow_order` debe existir
- `payment_data` debe existir
- `photos_sent_at` aún NULL (normal)

**Si dura más de 1 minuto**: ⚠️ PROBLEMA - Email falló o sistema atascado

---

### ✅ `delivered` - Fotos Entregadas

**Qué significa**:
- Fotos enviadas exitosamente al cliente
- Cliente tiene acceso a los links de descarga
- Links válidos por 7 días

**Qué hacer**:
- **Nada** - Todo correcto
- Esperar a que expiren (o cliente descargue)

**Verificar integridad**:
- `photos_sent_at` debe existir ✅
- `download_links_expires_at` debe existir ✅
- `flow_order` puede o no existir (si fue envío manual)

**Casos válidos**:
1. Con pago: `flow_order` + `payment_data` + `photos_sent_at`
2. Sin pago: Solo `photos_sent_at` (envío manual)

---

### ⏰ `expired` - Enlaces Expirados

**Qué significa**:
- Fotos fueron enviadas
- Pasaron 7 días desde el envío
- Links ya NO funcionan

**Qué hacer**:
1. Click "Reenviar fotos"
2. Se regeneran links (nuevos 7 días)
3. Status vuelve a `delivered`

**Verificar integridad**:
- `photos_sent_at` debe existir
- `download_links_expires_at < NOW()`

---

## 🧪 CASOS DE PRUEBA

### Prueba 1: Flujo normal con webhook

```bash
# 1. Crear solicitud
→ status = 'pending', photos_sent_at = NULL

# 2. Pagar en Flow
→ status = 'paid' (1 seg), flow_order = 123

# 3. Webhook envía fotos
→ status = 'delivered', photos_sent_at = NOW()

# 4. Después de 7 días
→ status = 'expired'

✅ CORRECTO
```

### Prueba 2: Envío manual sin pago

```bash
# 1. Crear solicitud
→ status = 'pending'

# 2. Admin click "Enviar fotos"
→ status = 'delivered', photos_sent_at = NOW()

# Nota: flow_order = NULL (no hay pago)

✅ CORRECTO (caso especial)
```

### Prueba 3: Webhook falla

```bash
# 1. Crear solicitud
→ status = 'pending'

# 2. Pagar en Flow (webhook NO llega)
→ status = 'pending' (NO cambió)

# 3. Verificar en Flow Dashboard
→ Hay pago ✅

# 4. Actualizar manualmente
→ status = 'delivered', flow_order = 123, photos_sent_at = NOW()

⚠️ SOLUCIÓN DE EMERGENCIA (webhook debe arreglarse)
```

---

## 💡 REGLAS DE ORO

### ✅ Estados correctos:

1. **`pending` + NULL en todo** → Esperando pago (normal)
2. **`paid` + flow_order + NULL photos_sent_at** → Enviando (dura segundos)
3. **`delivered` + photos_sent_at** → Todo correcto
4. **`expired` + photos_sent_at + links vencidos** → Normal después de 7 días

### ❌ Estados INCORRECTOS (requieren corrección):

1. **`pending` + flow_order** → Webhook falló
2. **`paid` + photos_sent_at** → Debería ser `delivered`
3. **`delivered` + NULL photos_sent_at** → Inconsistencia
4. **`paid` por más de 1 minuto** → Email falló

---

## 🔧 SCRIPTS DE MANTENIMIENTO

### Detectar solicitudes atoradas en 'paid'

```javascript
// Ejecutar si ves muchas en 'paid' por varios minutos
SELECT id, client_name, status, created_at
FROM photo_requests
WHERE status = 'paid'
  AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

// Si encuentra resultados: ERROR - investigar logs
```

### Corregir estados inconsistentes

```javascript
// Actualizar 'paid' → 'delivered' si ya tienen photos_sent_at
UPDATE photo_requests
SET status = 'delivered'
WHERE status = 'paid'
  AND photos_sent_at IS NOT NULL;

// Ejecutar solo si detectas inconsistencias
```

### Marcar enlaces expirados

```javascript
// Ejecutar diariamente (cronjob)
UPDATE photo_requests
SET status = 'expired'
WHERE status = 'delivered'
  AND download_links_expires_at < NOW();
```

---

## 📞 FAQ

### P: ¿Por qué existen 2 estados para "fotos enviadas"?

**R**: No existen dos. Solo `delivered` = fotos enviadas válidas.
`expired` = fotos enviadas pero links vencidos.

### P: ¿Puedo tener fotos enviadas sin pago?

**R**: Sí, si usas "Enviar fotos" manual. Status será `delivered` pero sin `flow_order`.

### P: ¿Qué pasa si el webhook falla?

**R**: Quedará en `pending` aunque haya pago en Flow. Debes actualizar manualmente.

### P: ¿Cómo sé si las fotos realmente se enviaron?

**R**: Mira `photos_sent_at`. Si tiene fecha = fotos enviadas. Si es NULL = NO enviadas.

### P: ¿Status 'paid' significa que las fotos se enviaron?

**R**: NO necesariamente. `paid` es temporal (segundos). Mira `photos_sent_at` para confirmar.

### P: ¿Puedo confiar en el status para saber si entregué las fotos?

**R**: SÍ, pero verifica ambos:
- `status = 'delivered'` → OK
- `photos_sent_at IS NOT NULL` → Confirmación

---

## ✅ RESUMEN PARA EQUIPO DE SOPORTE

**Pregunta del cliente**: "¿Ya me enviaron las fotos?"

**Cómo verificar**:
1. Buscar solicitud por email/nombre
2. Ver campo `photos_sent_at`:
   - ✅ **Tiene fecha**: "Sí, enviadas el [fecha]"
   - ❌ **NULL**: "No, aún no se han enviado"
3. Ver campo `status`:
   - `delivered`: "Sí, enlaces válidos hasta [expiresAt]"
   - `expired`: "Sí pero enlaces expirados, reenviar"
   - `paid`: "Se están enviando ahora"
   - `pending`: "No, falta completar el pago"

**No confiar solo en el status**, siempre verificar `photos_sent_at`.

---

**Última actualización**: 2026-01-18
**Próxima revisión**: Cuando se implemente cronjob de expiración

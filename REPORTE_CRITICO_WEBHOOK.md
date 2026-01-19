# 🚨 REPORTE CRÍTICO: Webhook de Flow NO procesó pago

**Fecha del incidente**: 2026-01-18
**Pago afectado**: Camila Romero - Flow Order #157331211
**Monto**: $20,000 CLP
**Estado en Flow**: PAGADO ✅
**Estado en BD (antes)**: pending ❌ (NO REGISTRADO)

---

## 📊 RESUMEN DEL INCIDENTE

### Lo que debió pasar:
```
Cliente paga en Flow
    ↓
Flow envía webhook a tu servidor
    ↓
Webhook procesa el pago
    ↓
Status: pending → paid
    ↓
Email enviado automáticamente
```

### Lo que REALMENTE pasó:
```
Cliente Camila pagó $20,000 ✅
    ↓
Flow recibió el pago ✅
    ↓
Webhook NO se ejecutó ❌
    ↓
BD quedó con status=pending ❌
    ↓
Email NO enviado automáticamente ❌
    ↓
ENVIADO MANUALMENTE después
```

---

## 🔍 EVIDENCIA

### Datos en Flow (confirmados por ti):
```
Orden: 157331211
Estado: Por depositar
Pagado el: 18-01-2026 15:56
Medio: Webpay
Monto: $20.000
Comisión: $638 (3.19% + IVA)
Pagado por: camiromero1401@hotmail.com
```

### Datos en tu BD (ANTES de fix manual):
```
request_id: 0fd3a16c-4cb7-40c8-90fc-214bf8ddcb58
status: delivered (ya se envió manualmente)
flow_order: NULL ❌
payment_data: NULL ❌
payment_date: NULL ❌
transaction_details: NULL ❌
```

### Datos en tu BD (DESPUÉS de fix manual):
```
status: paid
flow_order: 157331211 ✅
payment_data: { ... } ✅
payment_date: 2026-01-18T15:56:00Z ✅
transaction_details: { ... } ✅
```

---

## 🎯 CAUSAS POSIBLES

### 1. Webhook NO configurado en Flow
**Probabilidad**: 🔴 ALTA

**Verificar**:
1. Ir a Flow Dashboard
2. Configuración → Webhooks
3. Buscar: `https://fotos.diablosrojoscl.com/api/webhooks/flow`

**Si no está configurado**:
- Flow NUNCA envió el webhook
- Esto explica por qué no se procesó

**Solución**:
- Agregar URL del webhook en Flow
- Probar con pago de prueba

### 2. Webhook configurado pero URL incorrecta
**Probabilidad**: 🟡 MEDIA

**Verificar**:
- URL debe ser: `https://fotos.diablosrojoscl.com/api/webhooks/flow`
- NO debe ser localhost
- NO debe tener typos

### 3. Webhook se envió pero falló
**Probabilidad**: 🟡 MEDIA

**Verificar en Vercel**:
1. Ir a Vercel Dashboard
2. Runtime Logs
3. Buscar timestamp: 18-01-2026 15:56
4. Buscar errores con "webhook" o "flow"

**Posibles errores**:
- Firma inválida
- Variables de entorno faltantes
- Error en el código
- Timeout

### 4. Flow tiene delay en enviar webhook
**Probabilidad**: 🟢 BAJA

Flow normalmente envía webhooks en segundos, no minutos.

---

## ✅ ACCIONES INMEDIATAS REALIZADAS

1. **Pago de Camila registrado manualmente** ✅
   - Flow Order: 157331211
   - Comisión real: $638
   - Distribución: Fotógrafo $15,490 / Director $3,872
   - payment_data completo guardado

2. **Error 402 de imágenes solucionado** ✅
   - Agregado `unoptimized={true}` a Next.js Image
   - Las imágenes ahora se cargan correctamente

3. **Error de reenvío de fotos solucionado** ✅
   - Eliminadas columnas inexistentes
   - Endpoint simplificado

---

## 🔧 ACCIONES REQUERIDAS URGENTES

### PASO 1: Verificar configuración de webhook en Flow

**Cómo hacerlo**:
1. Login en Flow: https://www.flow.cl
2. Ir a "Configuración" → "Webhooks" o "Integraciones"
3. Buscar webhook configurado

**URL correcta del webhook**:
```
https://fotos.diablosrojoscl.com/api/webhooks/flow
```

**Qué verificar**:
- ✅ URL está configurada
- ✅ URL NO tiene typos
- ✅ URL apunta a producción (no localhost)
- ✅ Webhook está ACTIVO

**Si NO está configurado**:
- Flow nunca enviará notificaciones
- TODOS los pagos fallarán igual que Camila
- Debes configurarlo AHORA

### PASO 2: Revisar logs de Vercel

**Cómo hacerlo**:
1. Ir a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Runtime Logs
4. Filtrar por fecha: 18-01-2026 15:00 - 16:00
5. Buscar "webhook" o "flow" o "157331211"

**Qué buscar**:
- ✅ Requests a `/api/webhooks/flow`
- ❌ Errores (status 4xx o 5xx)
- ❌ Timeouts
- ❌ Missing variables

### PASO 3: Hacer pago de prueba

**Cómo hacerlo**:
1. Crear solicitud de fotos de prueba
2. Completar pago con Flow
3. Verificar INMEDIATAMENTE:
   - ¿Logs en Vercel muestran webhook?
   - ¿Status cambió a "paid"?
   - ¿Email se envió automáticamente?

**Si falla**:
- Problema confirmado
- Necesitas revisar código del webhook

---

## 📋 CHECKLIST DE VERIFICACIÓN

Ejecuta esto para verificar que todo esté bien configurado:

### En Flow Dashboard:
- [ ] Webhook configurado
- [ ] URL: `https://fotos.diablosrojoscl.com/api/webhooks/flow`
- [ ] Webhook activo
- [ ] Sin errores recientes

### En Vercel Dashboard:
- [ ] Variables de entorno configuradas:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - FLOW_SECRET_KEY
  - FLOW_API_KEY
  - PRICE_PER_PHOTO
- [ ] Deployment exitoso (sin errores)
- [ ] Runtime logs accesibles

### En tu código:
- [ ] Archivo existe: `app/api/webhooks/flow/route.ts`
- [ ] Endpoint responde: GET y POST
- [ ] Logs se muestran en consola

---

## 🧪 SCRIPT DE PRUEBA

Usa esto para probar si el webhook está funcionando:

```bash
# En tu terminal local:
curl -X POST https://fotos.diablosrojoscl.com/api/webhooks/flow

# Deberías ver:
# {"status":"ok","service":"Flow webhook","timestamp":"...","ready":true}
```

Si ves ese mensaje, el endpoint está disponible.

---

## 💡 RECOMENDACIONES PARA PREVENIR

### 1. Monitor de webhooks
Crea un dashboard que muestre:
- Últimos webhooks recibidos
- Tiempo desde último webhook
- Errores recientes

### 2. Alertas automáticas
Configura alertas si:
- Han pasado >24h sin webhook
- Webhook falla 3 veces seguidas
- Solicitud queda en "pending" >1 hora después del pago

### 3. Página de estado del webhook
Crea `/admin/webhook-status` que muestre:
- ¿Webhook configurado?
- Último webhook recibido
- Logs recientes
- Test de conectividad

### 4. Backup manual
Si webhook falla:
- Consultar API de Flow directamente cada hora
- Verificar pagos pendientes
- Actualizar automáticamente

---

## 📞 PRÓXIMOS PASOS

1. **URGENTE**: Verificar configuración en Flow (hoy)
2. **URGENTE**: Hacer pago de prueba (hoy)
3. **IMPORTANTE**: Revisar logs de Vercel (hoy)
4. **IMPORTANTE**: Documentar configuración correcta (mañana)
5. **RECOMENDADO**: Implementar monitor de webhooks (esta semana)

---

## 🔗 RECURSOS ÚTILES

**Documentación Flow**:
- Webhooks: https://www.flow.cl/docs/api.html#tag/Webhooks
- API Reference: https://www.flow.cl/docs/api.html

**Tu código**:
- Webhook: `app/api/webhooks/flow/route.ts`
- Configuración: `.env.local` (local) / Vercel Dashboard (producción)

**Logs**:
- Vercel: https://vercel.com/[tu-proyecto]/logs
- Supabase: https://supabase.com/dashboard/project/[tu-proyecto]/logs

---

**Estado actual**: 🟡 SISTEMA FUNCIONANDO pero webhook NO procesó 1 pago

**Riesgo**: 🔴 ALTO - Si otros clientes pagan, puede fallar igual

**Acción inmediata**: Verificar configuración de webhook en Flow AHORA

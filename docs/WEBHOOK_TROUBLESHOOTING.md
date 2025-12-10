# Troubleshooting: Webhook de Flow no funciona

## Problema Actual

Los pagos se procesan correctamente en Flow, pero el webhook **NO está llegando** a nuestro servidor, por lo que:
- ❌ Las solicitudes quedan en status "pending"
- ❌ Los emails con fotos no se envían automáticamente
- ❌ Los clientes no reciben sus fotos

## Evidencia

### En Flow (funciona):
- ✅ Pagos procesados exitosamente
- ✅ Estado: "Por depositar"
- ✅ Órdenes creadas: 4843986, 4843263, etc.

### En nuestra base de datos (no funciona):
- ❌ Todas las solicitudes en status "pending"
- ❌ No hay `flow_order` guardado
- ❌ No hay `photos_sent_at`

### En Vercel Logs:
- ❌ NO aparece "🔵 Webhook Flow recibido"
- ❌ NO hay requests a `/api/webhooks/flow`

**Conclusión:** Flow NO está llamando nuestro webhook.

---

## Posibles Causas

### 1. Flow Sandbox no envía webhooks confiablemente ⚠️

**Problema conocido:** Flow Sandbox tiene bugs con webhooks:
- A veces los webhooks no se envían
- A veces se demoran horas
- A veces solo funcionan en producción

**Solución:** Probar en producción (Flow con credenciales reales).

### 2. URL del webhook incorrecta en código

**Verificar en:** `app/api/payment/create/route.ts:58`

```typescript
urlConfirmation: `${APP_URL}/api/webhooks/flow`,
```

**Variables a verificar:**
- `NEXT_PUBLIC_APP_URL` = `https://fotos.diablosrojoscl.com` ✅
- Endpoint existe en: `/app/api/webhooks/flow/route.ts` ✅
- Endpoint responde a POST ✅

**Estado:** ✅ URL parece correcta

### 3. Flow requiere configuración manual del webhook

Algunos sistemas de pago requieren:
1. Configurar la URL del webhook en el panel de administración
2. Activar las notificaciones webhook
3. Aprobar la URL (whitelist)

**Acción requerida:** Verificar en el panel de Flow si hay alguna sección de "Webhooks" o "Notificaciones" donde configurar la URL.

### 4. Flow está bloqueado por Vercel

Poco probable, pero posible:
- Vercel podría estar bloqueando requests de Flow
- Flow podría estar en una lista de IPs bloqueadas

**Verificación:** Los logs no muestran requests rechazados, solo ausencia total de requests.

---

## Soluciones Propuestas

### Solución 1: Verificar configuración en Flow (PRIORITARIO)

**Pasos:**

1. Inicia sesión en Flow: https://www.flow.cl/
2. Ve a tu perfil / configuración
3. Busca secciones como:
   - "Integraciones"
   - "API"
   - "Webhooks"
   - "Notificaciones"
   - "Configuración técnica"
4. Verifica si hay:
   - Campo para configurar URL de webhook
   - Toggle para activar notificaciones
   - Lista de webhooks configurados

**Si encuentras configuración de webhooks:**
- Agrega: `https://fotos.diablosrojoscl.com/api/webhooks/flow`
- Activa las notificaciones
- Guarda los cambios

**Si NO hay configuración de webhooks:**
- Contacta a soporte de Flow: soporte@flow.cl
- Pregunta: "¿Por qué el webhook (urlConfirmation) no está siendo llamado en sandbox?"

### Solución 2: Probar en producción (RECOMENDADO)

Flow Sandbox puede tener limitaciones. Para estar seguros que funciona en producción:

**Pasos:**

1. **NO cambiar** `FLOW_SANDBOX=true` todavía
2. Contactar a Flow para confirmar que webhooks funcionan en producción
3. Hacer una prueba con **monto mínimo real** ($350 CLP)
4. Monitorear logs de Vercel
5. Si funciona, entonces el problema es solo sandbox

**Costo de prueba:** ~$350 CLP (~$0.40 USD)

### Solución 3: Sistema de respaldo manual (TEMPORAL)

Mientras se resuelve el webhook, implementar proceso manual:

**Panel de Admin:**
1. Agregar columna "Flow Order" en tabla de solicitudes
2. Agregar botón "Sincronizar Pago" por solicitud
3. Al hacer clic, llama a `/api/sync-payment`
4. El sistema envía las fotos automáticamente

**Pasos para el admin:**
1. Ver solicitud pendiente
2. Verificar en Flow que el pago se procesó
3. Copiar número de orden de Flow
4. Clic en "Sincronizar Pago"
5. Pegar número de orden
6. Sistema envía fotos automáticamente

**Pros:**
- ✅ Funciona inmediatamente
- ✅ No depende de Flow
- ✅ Admin tiene control

**Contras:**
- ❌ Requiere intervención manual
- ❌ No es automático

### Solución 4: Polling automático (AVANZADO)

Implementar verificación automática cada X minutos:

**Opción A - Vercel Cron Job:**
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/check-pending-payments",
    "schedule": "*/5 * * * *"  // Cada 5 minutos
  }]
}
```

**Opción B - Cliente polling:**
En el panel de admin, verificar automáticamente cada minuto si hay pagos pendientes.

**Pros:**
- ✅ Automático
- ✅ No depende de Flow webhook

**Contras:**
- ❌ Más complejo
- ❌ Requiere token de Flow (que solo viene en webhook)
- ❌ Más requests a Flow API

---

## Plan de Acción Recomendado

### Paso 1: Investigación (HOY)

1. ✅ Revisar panel de Flow buscando configuración de webhooks
2. ✅ Contactar soporte de Flow preguntando por webhooks en sandbox
3. ✅ Hacer prueba con logging mejorado

### Paso 2: Solución temporal (HOY)

1. ✅ Usar endpoint `/api/sync-payment` para pagos de prueba
2. ⚠️ Documentar proceso para el admin
3. ⚠️ Agregar botón "Sincronizar Pago" en panel de admin (opcional)

### Paso 3: Validación producción (ESTA SEMANA)

1. ⚠️ Coordinar con Flow para hacer prueba en producción
2. ⚠️ Hacer pago real de $350 CLP de prueba
3. ⚠️ Verificar que webhook llega correctamente
4. ⚠️ Si funciona → problema es solo sandbox
5. ⚠️ Si NO funciona → investigar más profundo

### Paso 4: Producción (CUANDO ESTÉ VALIDADO)

1. Cambiar `FLOW_SANDBOX=false`
2. Actualizar credenciales a producción
3. Monitorear primeros pagos reales
4. Tener plan B listo (sincronización manual)

---

## Logs de Depuración

### Verificar webhook en tiempo real:

1. Hacer pago de prueba
2. En otra pestaña, abrir Vercel Logs: https://vercel.com → Proyecto → Logs
3. Buscar líneas con:
   - `🔵 Webhook Flow recibido`
   - `POST /api/webhooks/flow`
   - Errores con "webhook" o "flow"

### Ver solicitudes pendientes:

```bash
curl https://fotos.diablosrojoscl.com/api/test-webhook
```

### Ver pagos pendientes para verificar:

```bash
curl https://fotos.diablosrojoscl.com/api/check-pending-payments
```

### Sincronizar pago manualmente:

```bash
curl -X POST https://fotos.diablosrojoscl.com/api/sync-payment \
  -H "Content-Type: application/json" \
  -d '{"requestId": "ID_AQUI", "flowOrder": "NUMERO_ORDEN_FLOW"}'
```

---

## Contactos

- **Flow Soporte:** soporte@flow.cl
- **Flow Documentación:** https://developers.flow.cl/
- **Flow API:** https://www.flow.cl/docs/api.html

---

## Checklist Pre-Producción

Antes de lanzar a producción, verificar:

- [ ] Webhook funciona en al menos una prueba real
- [ ] Logs muestran "🔵 Webhook Flow recibido"
- [ ] Email se envía automáticamente
- [ ] Status se actualiza a "paid" automáticamente
- [ ] photos_sent_at se registra correctamente
- [ ] Cliente recibe email con links funcionando
- [ ] Links de descarga funcionan y descargan fotos
- [ ] Sistema de respaldo manual está listo (por si acaso)
- [ ] Admin sabe cómo usar sincronización manual si es necesario

---

## Estado Actual

**Fecha:** 2025-12-10
**Ambiente:** Sandbox
**Webhook:** ❌ NO funciona
**Pagos:** ✅ Se procesan en Flow
**Solución temporal:** ✅ Sincronización manual disponible
**Siguiente paso:** Investigar configuración en Flow / Contactar soporte

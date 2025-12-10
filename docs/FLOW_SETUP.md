# Configuración de Flow Payment Gateway

Esta guía te ayudará a configurar Flow Chile como pasarela de pago para tu aplicación de fotografía.

## ¿Qué es Flow?

Flow es una pasarela de pago chilena que permite recibir pagos con:
- Tarjetas de crédito y débito
- Transferencias bancarias
- Débito automático

### Ventajas de Flow para cuentas personales:
- ✅ Solo pagas comisión por transacción (3.51% aprox.)
- ✅ Sin costos de instalación
- ✅ Sin mensualidades
- ✅ Puedes operar como persona natural
- ✅ Retiros inmediatos sin períodos de retención

---

## Paso 1: Crear cuenta en Flow

1. Ve a [https://www.flow.cl/](https://www.flow.cl/)
2. Haz clic en **"Crear cuenta"** o **"Registrarse"**
3. Completa el formulario:
   - Tipo de cuenta: **Persona Natural** (o Empresa si corresponde)
   - RUT
   - Datos personales
   - Email y contraseña
4. Verifica tu email
5. Completa la información bancaria para recibir tus pagos

---

## Paso 2: Obtener credenciales API

### Modo Sandbox (Pruebas)

1. Inicia sesión en Flow
2. Ve a **"Integraciones"** o **"API"** en el menú
3. Busca la sección de **"Credenciales Sandbox"**
4. Copia:
   - **API Key** (apiKey)
   - **Secret Key** (secretKey)

⚠️ **Importante:** Estas credenciales son para pruebas y NO procesan pagos reales.

### Modo Producción

1. En el mismo panel de Flow
2. Ve a **"Credenciales de Producción"**
3. Copia:
   - **API Key** (apiKey)
   - **Secret Key** (secretKey)

⚠️ **Importante:** Estas credenciales SÍ procesan pagos reales con dinero real.

---

## Paso 3: Configurar variables de entorno

### Desarrollo local (.env.local)

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```bash
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Flow Payment Gateway - SANDBOX
FLOW_API_KEY=tu-api-key-sandbox
FLOW_SECRET_KEY=tu-secret-key-sandbox
FLOW_SANDBOX=true
```

### Producción (Vercel)

En Vercel Dashboard:

1. Ve a tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
NEXT_PUBLIC_APP_URL=https://fotos.diablosrojoscl.com
FLOW_API_KEY=tu-api-key-produccion
FLOW_SECRET_KEY=tu-secret-key-produccion
FLOW_SANDBOX=false
```

⚠️ **Importante:**
- Usa `FLOW_SANDBOX=false` en producción
- Asegúrate de usar las credenciales de **producción**, no las de sandbox

---

## Paso 4: Configurar Webhook en Flow

El webhook permite que Flow notifique a tu aplicación cuando un pago es confirmado.

### URL del Webhook

Tu webhook está en:
```
https://tu-dominio.com/api/webhooks/flow
```

### Configurar en Flow Dashboard

1. En Flow, ve a **"Integraciones"** → **"Webhooks"**
2. Agrega una nueva URL de webhook:
   - **URL:** `https://fotos.diablosrojoscl.com/api/webhooks/flow`
   - **Eventos:** Selecciona "Confirmación de pago"
3. Guarda los cambios

⚠️ **Seguridad:** El webhook verifica la firma HMAC SHA256 para asegurar que las notificaciones vienen de Flow.

---

## Paso 5: Probar en Sandbox

### Tarjetas de prueba Flow

Flow proporciona tarjetas de prueba para simular pagos:

**Tarjeta Aprobada:**
- Número: `4051 8856 0000 0005`
- CVV: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura

**Tarjeta Rechazada:**
- Número: `4051 8842 3000 0001`
- CVV: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura

### Proceso de prueba

1. Asegúrate de tener `FLOW_SANDBOX=true` en `.env.local`
2. Inicia tu aplicación: `npm run dev`
3. Selecciona fotos y haz una solicitud
4. Serás redirigido a Flow (entorno sandbox)
5. Usa una tarjeta de prueba
6. Completa el pago
7. Deberías ser redirigido de vuelta a tu aplicación
8. Verifica que recibiste el email con las fotos

### Verificar logs

Revisa los logs en tu terminal para ver:
- ✅ Pago creado
- ✅ Webhook recibido
- ✅ Firma verificada
- ✅ Email enviado

---

## Paso 6: Pasar a Producción

Cuando estés listo para recibir pagos reales:

### 1. Verificar cuenta Flow

- Asegúrate de haber completado la verificación de tu cuenta
- Confirma que tu información bancaria está correcta

### 2. Actualizar variables de entorno en Vercel

```
FLOW_API_KEY=tu-api-key-PRODUCCION
FLOW_SECRET_KEY=tu-secret-key-PRODUCCION
FLOW_SANDBOX=false
```

### 3. Actualizar webhook en Flow

- Verifica que la URL del webhook apunte a tu dominio de producción
- Prueba el webhook desde el panel de Flow

### 4. Hacer una prueba real

⚠️ **Importante:** Tu primera transacción será con dinero real.

1. Realiza una compra de prueba con tu propia tarjeta
2. Verifica el proceso completo:
   - Redirección a Flow ✓
   - Pago procesado ✓
   - Webhook recibido ✓
   - Email con fotos enviado ✓
   - Dinero recibido en tu cuenta Flow ✓

---

## Flujo completo del pago

1. **Usuario selecciona fotos** → Marca favoritas en la galería
2. **Usuario hace solicitud** → Completa formulario con sus datos
3. **Sistema crea solicitud** → Guarda en base de datos con status "pending"
4. **Sistema crea pago Flow** → Calcula monto ($2000 x cantidad de fotos)
5. **Usuario es redirigido a Flow** → Completa el pago
6. **Flow procesa pago** → Usuario paga con tarjeta/transferencia
7. **Flow envía webhook** → Notifica a tu aplicación
8. **Sistema verifica webhook** → Valida firma HMAC SHA256
9. **Sistema actualiza solicitud** → Cambia status a "paid"
10. **Sistema genera links** → Crea URLs firmadas de Supabase Storage (7 días)
11. **Sistema envía email** → Cliente recibe fotos en alta resolución
12. **Usuario descarga fotos** → Desde los links del email

---

## Precios y comisiones

### Flow - Cuenta Personal (Persona Natural)

- **Comisión por transacción:** ~3.51%
- **Costo de instalación:** $0
- **Mensualidad:** $0
- **Retiro de fondos:** Inmediato, sin retención

### Ejemplo de cálculo:

Si vendes 10 fotos:
- **Precio:** 10 fotos × $2,000 = $20,000 CLP
- **Comisión Flow:** $20,000 × 3.51% = $702 CLP
- **Recibes:** $19,298 CLP

---

## Seguridad

El sistema implementa las siguientes medidas de seguridad:

1. **Firma HMAC SHA256:** Todos los requests a Flow incluyen una firma
2. **Verificación de webhook:** El webhook valida que la notificación viene de Flow
3. **Prevención de duplicados:** Verifica que las fotos no se hayan enviado previamente
4. **URLs firmadas:** Los links de descarga expiran en 7 días
5. **Validación de status:** Solo se envían fotos si el pago está confirmado

---

## Troubleshooting

### El pago no se confirma

1. Verifica que `FLOW_SANDBOX=false` en producción
2. Revisa los logs del webhook en Vercel
3. Verifica que la URL del webhook esté configurada correctamente en Flow
4. Asegúrate de que el webhook sea público (sin autenticación)

### No llega el email con las fotos

1. Verifica la configuración de Gmail SMTP
2. Revisa la carpeta de spam del cliente
3. Consulta los logs en Vercel para ver si el email se envió
4. Verifica que `GMAIL_APP_PASSWORD` sea correcto

### La firma del webhook es inválida

1. Verifica que `FLOW_SECRET_KEY` sea correcta
2. Asegúrate de estar usando la misma key en Flow y en tu app
3. Revisa que no haya espacios extra en la variable de entorno

### Error al generar links de descarga

1. Verifica los permisos de Supabase Storage
2. Asegúrate de que las fotos existan en el bucket
3. Revisa que la política de Storage permita generar URLs firmadas

---

## Soporte

### Flow
- Documentación: [https://www.flow.cl/docs/](https://www.flow.cl/docs/)
- Soporte: soporte@flow.cl

### Aplicación
- Para problemas técnicos, revisa los logs en Vercel
- Para problemas de configuración, verifica las variables de entorno

---

## Checklist de Configuración

Antes de lanzar a producción, verifica:

- [ ] Cuenta Flow creada y verificada
- [ ] Credenciales de producción obtenidas
- [ ] Variables de entorno configuradas en Vercel
- [ ] `FLOW_SANDBOX=false` en producción
- [ ] Webhook configurado en Flow Dashboard
- [ ] Información bancaria completa en Flow
- [ ] Prueba de pago real realizada exitosamente
- [ ] Email de confirmación recibido
- [ ] Links de descarga funcionando
- [ ] Dinero recibido en cuenta Flow

¡Listo! Tu sistema de pagos Flow está configurado y funcionando.

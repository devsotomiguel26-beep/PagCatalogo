# Configuración de Resend para Emails

## ¿Por qué Resend?

Nodemailer (Gmail SMTP) no funciona correctamente en entornos serverless como Vercel. Resend está diseñado específicamente para aplicaciones modernas:

- ✅ Diseñado para Next.js y Vercel
- ✅ Gratuito hasta 3,000 emails/mes
- ✅ Excelente deliverability
- ✅ Panel para monitorear emails
- ✅ Funciona perfectamente en serverless

---

## Setup Rápido (5 minutos)

### Paso 1: Crear cuenta en Resend

1. Ve a https://resend.com/
2. Haz clic en **"Sign Up"**
3. Regístrate con tu email (o GitHub)
4. Verifica tu email

### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **"API Keys"**
2. Haz clic en **"Create API Key"**
3. Nombre: `Diablos Rojos Foto - Production`
4. Permisos: **"Sending access"** (lo mínimo necesario)
5. Copia el API key (empieza con `re_...`)

⚠️ **Importante:** Guarda el API key en un lugar seguro, solo se muestra una vez.

### Paso 3: Configurar en Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega estas variables:

```
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Nota sobre RESEND_FROM_EMAIL:**
- Por defecto usa `onboarding@resend.dev` (email de prueba de Resend)
- Funciona inmediatamente, sin configuración adicional
- Los emails llegarán con remitente "onboarding@resend.dev"
- Para usar tu propio dominio, sigue el Paso 4 (opcional)

4. Haz clic en **"Save"**
5. Vercel hará redeploy automáticamente

### Paso 4: Usar tu propio dominio (Opcional pero recomendado)

Para que los emails vengan de `noreply@diablosrojoscl.com`:

1. En Resend, ve a **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `diablosrojoscl.com`
4. Resend te dará registros DNS para agregar:
   - **SPF record**
   - **DKIM record**
   - **DMARC record** (opcional pero recomendado)

5. Ve a tu proveedor DNS (Hostinger) y agrega los registros
6. Vuelve a Resend y haz clic en **"Verify"**
7. Una vez verificado, actualiza en Vercel:
   ```
   RESEND_FROM_EMAIL=noreply@diablosrojoscl.com
   ```

---

## Verificación

### Probar que funciona

Después del deployment, ejecuta:

```bash
curl -X POST https://fotos.diablosrojoscl.com/api/sync-payment \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "TU_REQUEST_ID",
    "flowOrder": "153350018"
  }'
```

**Debería responder:**
```json
{
  "success": true,
  "message": "Pago sincronizado y fotos enviadas",
  ...
}
```

Y **deberías recibir el email** en tu correo.

### Ver emails enviados

1. Ve a Resend Dashboard → **"Emails"**
2. Verás todos los emails enviados
3. Puedes ver:
   - Estado (delivered, bounced, etc.)
   - Contenido del email
   - Logs de entrega

---

## Troubleshooting

### Error: "Missing API key"

**Causa:** `RESEND_API_KEY` no configurada en Vercel

**Solución:**
1. Verifica que agregaste la variable en Vercel
2. Asegúrate que sea para "Production" (no solo Preview)
3. Haz redeploy si es necesario

### Error: "Invalid from address"

**Causa:** El dominio en `RESEND_FROM_EMAIL` no está verificado

**Solución temporal:**
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Solución permanente:**
Verifica tu dominio en Resend (Paso 4 arriba)

### Los emails van a spam

**Causa:** Dominio no verificado o sin registros DNS

**Solución:**
1. Verifica tu dominio en Resend
2. Agrega los registros SPF, DKIM, y DMARC
3. Espera 24-48 horas para propagación DNS

---

## Límites y Costos

### Plan Gratuito (Free)

- **3,000 emails/mes**
- Suficiente para ~100 pedidos/mes (asumiendo 30 emails/pedido)
- Sin costo adicional
- Sin tarjeta de crédito requerida

### Si necesitas más

- **Plan Pro:** $20/mes = 50,000 emails
- **Plan Enterprise:** Personalizado

**Para tu caso:** El plan gratuito es más que suficiente para empezar.

---

## Comparación: Resend vs Gmail SMTP

| Feature | Resend | Gmail SMTP |
|---------|--------|------------|
| Funciona en Vercel | ✅ Perfectamente | ❌ Problemas |
| Gratis | ✅ 3k emails/mes | ✅ Ilimitado |
| Setup | ✅ 5 minutos | ⚠️ 15+ minutos |
| Deliverability | ✅ Excelente | ⚠️ Regular |
| Monitoreo | ✅ Dashboard completo | ❌ No |
| Límite de envío | 3k/mes (gratis) | 500/día |
| Dominio propio | ✅ Sí | ❌ Solo Gmail |

**Conclusión:** Resend es la mejor opción para aplicaciones en Vercel.

---

## Migración desde Gmail

Si tenías Gmail configurado:

1. ✅ Ya no necesitas `GMAIL_USER` y `GMAIL_APP_PASSWORD`
2. ✅ Puedes eliminar esas variables de Vercel
3. ✅ El código ya está actualizado para usar Resend
4. ✅ Solo agrega `RESEND_API_KEY` y `RESEND_FROM_EMAIL`

---

## Checklist de Configuración

- [ ] Cuenta creada en Resend
- [ ] API Key obtenida
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] `RESEND_FROM_EMAIL` configurada en Vercel
- [ ] Deployment completado
- [ ] Prueba de email enviada exitosamente
- [ ] (Opcional) Dominio verificado en Resend
- [ ] (Opcional) Registros DNS agregados

---

## Recursos

- **Resend Dashboard:** https://resend.com/overview
- **Documentación:** https://resend.com/docs
- **Status Page:** https://resend.instatus.com/

---

## Soporte

Si tienes problemas:
1. Revisa los logs en Vercel
2. Revisa los logs en Resend Dashboard
3. Contacta soporte de Resend: support@resend.com (muy responsivos)

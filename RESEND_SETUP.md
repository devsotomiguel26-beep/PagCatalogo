# Configuración de Emails con Resend

Este documento explica cómo configurar el sistema de notificaciones por email usando Resend.

## 1. Instalar la dependencia

Primero, instala el paquete de Resend:

```bash
npm install resend
```

## 2. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

## 3. Obtener tu API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "Diablos Rojos Foto Production")
4. Copia la API key generada

## 4. Configurar dominio (Recomendado para producción)

### Opción A: Dominio verificado (Recomendado)

Para enviar emails desde tu propio dominio:

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `diablosrojosfoto.com`)
4. Sigue las instrucciones para agregar los registros DNS:
   - SPF
   - DKIM
   - MX (opcional)
5. Espera a que Resend verifique tu dominio (puede tardar unos minutos)

Una vez verificado, podrás enviar desde emails como:
- `noreply@diablosrojosfoto.com`
- `contacto@diablosrojosfoto.com`
- Cualquier dirección en tu dominio

### Opción B: Dominio de prueba (Solo para desarrollo)

Resend te da un dominio de prueba automáticamente (`onboarding@resend.dev`), pero solo puedes enviar emails a direcciones que agregues manualmente.

**Limitaciones:**
- Solo para pruebas
- Debes agregar cada email destinatario manualmente
- No recomendado para producción

## 5. Configurar variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Resend (Email notifications)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@diablosrojosfoto.com
ADMIN_EMAIL=admin@diablosrojosfoto.com
```

**Explicación:**
- `RESEND_API_KEY`: Tu API key de Resend
- `RESEND_FROM_EMAIL`: La dirección desde la que se enviarán los emails (debe ser de tu dominio verificado)
- `ADMIN_EMAIL`: El email donde recibirás notificaciones de nuevas solicitudes

## 6. Probar el sistema

### Prueba 1: Verificar que Resend funciona

Puedes probar enviando un email de prueba desde el dashboard de Resend.

### Prueba 2: Probar el flujo completo

1. Inicia tu aplicación: `npm run dev`
2. Ve a una galería pública
3. Marca algunas fotos como favoritas
4. Haz clic en el botón flotante de solicitud
5. Llena el formulario con tus datos
6. Envía la solicitud
7. Verifica que:
   - La solicitud aparece en `/admin/solicitudes`
   - Recibiste un email de confirmación en el email del cliente
   - Recibiste una notificación en el email del admin

## 7. Solución de problemas

### Error: "Missing required fields"
Verifica que todos los campos del formulario estén completos.

### Error: "Failed to send emails"
- Verifica que tu `RESEND_API_KEY` sea correcta
- Verifica que el email `RESEND_FROM_EMAIL` sea de un dominio verificado
- Revisa los logs en el dashboard de Resend

### Los emails no llegan
- Revisa la carpeta de spam
- Verifica que el dominio esté correctamente verificado en Resend
- Revisa los logs en el dashboard de Resend (sección **Logs**)

### Email llega pero con formato incorrecto
Los templates están en `lib/email-templates.tsx`. Puedes modificarlos según tus necesidades.

## 8. Personalización de templates

Los templates de email están en `/lib/email-templates.tsx`:

- `getPhotoRequestConfirmationEmail`: Email de confirmación al cliente
- `getAdminNotificationEmail`: Email de notificación al administrador

Puedes modificar estos templates para cambiar:
- Texto
- Colores (actualmente usa rojo #dc2626 para el tema)
- Estructura
- Información mostrada

## 9. Límites del plan gratuito de Resend

El plan gratuito de Resend incluye:
- **3,000 emails/mes**
- **100 emails/día**
- 1 dominio verificado
- Soporte por email

Para la mayoría de las galerías deportivas, esto debería ser suficiente. Si necesitas más, puedes upgrader a un plan de pago.

## 10. Buenas prácticas

1. **Usa un dominio verificado en producción**: Esto mejora la deliverability de tus emails
2. **Configura SPF y DKIM**: Ayuda a evitar que tus emails caigan en spam
3. **Monitorea los logs**: Resend te muestra si los emails fueron entregados, rebotados, etc.
4. **Personaliza los templates**: Agrega tu logo, ajusta los colores a tu marca
5. **Prueba primero con emails propios**: Antes de lanzar a producción, envía emails de prueba

## 11. Alternativas a Resend

Si prefieres usar otro servicio de email, puedes modificar `/app/api/send-request-email/route.ts` para usar:
- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **Postmark**

La estructura general sería la misma, solo cambiaría la librería y configuración.

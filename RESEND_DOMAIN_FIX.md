# Solución al Error de Dominio No Verificado en Resend

## El Error que estás viendo:

```
The diablosrojoscl.com domain is not verified. Please, add and verify your domain on https://resend.com/domains
```

Este error significa que Resend no puede enviar emails desde `diablosrojoscl.com` porque el dominio no ha sido verificado correctamente.

## Soluciones

### Opción 1: Verificar tu dominio (Recomendado para producción)

Si ya tienes acceso al DNS de `diablosrojoscl.com`, sigue estos pasos:

#### Paso 1: Agregar el dominio en Resend

1. Ve a https://resend.com/domains
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `diablosrojoscl.com`
4. Haz clic en **"Add"**

#### Paso 2: Agregar registros DNS

Resend te mostrará varios registros DNS que debes agregar. Necesitas agregar estos registros en tu proveedor de DNS (GoDaddy, Cloudflare, etc.):

**Registros típicos que necesitas:**

1. **SPF Record (TXT)**
   ```
   Tipo: TXT
   Nombre: @ (o tu dominio)
   Valor: v=spf1 include:_spf.resend.com ~all
   ```

2. **DKIM Records (TXT)** - Resend te dará 3 registros específicos
   ```
   Tipo: TXT
   Nombre: resend._domainkey (o similar, usa el que Resend te dé)
   Valor: [Valor largo que Resend te proporciona]
   ```

3. **MX Record (Opcional pero recomendado)**
   ```
   Tipo: MX
   Nombre: @ (o tu dominio)
   Valor: feedback-smtp.us-east-1.amazonses.com
   Prioridad: 10
   ```

#### Paso 3: Esperar verificación

- Los cambios DNS pueden tardar de 5 minutos a 48 horas en propagarse
- Resend verifica automáticamente cada cierto tiempo
- Puedes hacer clic en "Verify" en Resend para forzar la verificación
- Una vez verificado, verás un badge verde de "Verified"

#### Paso 4: Actualizar .env.local

Asegúrate de que tu archivo `.env.local` tenga el email correcto:

```bash
RESEND_FROM_EMAIL=noreply@diablosrojoscl.com
# O cualquier otro email de tu dominio verificado
```

---

### Opción 2: Usar el dominio de prueba de Resend (Solo para desarrollo/testing)

Si aún no tienes acceso al DNS o quieres probar rápidamente:

#### Paso 1: Actualizar .env.local

Cambia el `RESEND_FROM_EMAIL` para usar el dominio de prueba de Resend:

```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### Paso 2: Agregar emails de prueba

En Resend, ve a **"Emails"** → **"Add Email"** y agrega los emails a los que quieres enviar pruebas:

- Tu email personal
- El email del administrador

**Limitaciones:**
- Solo puedes enviar a emails que agregues manualmente
- No recomendado para producción
- Los emails tienen un encabezado que dice "Test mode"

---

### Opción 3: Usar un subdominio (Alternativa si no puedes modificar el dominio principal)

Si no tienes acceso al DNS del dominio principal, puedes usar un subdominio:

#### Paso 1: Crear subdominio

Crea un subdominio como `mail.diablosrojoscl.com` en tu proveedor DNS.

#### Paso 2: Agregar a Resend

1. Ve a https://resend.com/domains
2. Agrega el subdominio: `mail.diablosrojoscl.com`
3. Sigue los mismos pasos de verificación DNS

#### Paso 3: Actualizar .env.local

```bash
RESEND_FROM_EMAIL=noreply@mail.diablosrojoscl.com
```

---

## Verificar que funciona

Una vez configurado cualquier opción, prueba el sistema:

1. Reinicia tu aplicación: `npm run dev`
2. Ve a una galería pública
3. Marca fotos como favoritas (ahora con el botón de corazón en cada miniatura)
4. Haz clic en el botón flotante
5. Llena el formulario (ahora incluye teléfono)
6. Envía la solicitud
7. Revisa:
   - La consola del navegador (debería mostrar logs de emails enviados)
   - Tu email para la confirmación
   - El panel admin en `/admin/solicitudes` para ver la solicitud

---

## Solución de problemas

### El dominio no verifica después de agregar registros DNS

1. **Verifica que los registros DNS estén correctos:**
   ```bash
   # En terminal (Mac/Linux):
   dig TXT diablosrojoscl.com
   dig TXT resend._domainkey.diablosrojoscl.com
   ```

2. **Espera más tiempo:** A veces puede tardar hasta 48 horas

3. **Contacta a tu proveedor DNS:** Asegúrate de que permiten registros SPF/DKIM

### Los emails siguen sin llegar

1. **Revisa la consola:** ¿Hay errores de Resend?
2. **Revisa el dashboard de Resend:** Ve a **"Logs"** para ver el estado de los emails
3. **Revisa spam:** Los primeros emails pueden caer en spam
4. **Verifica las variables de entorno:**
   ```bash
   echo $RESEND_API_KEY
   echo $RESEND_FROM_EMAIL
   echo $ADMIN_EMAIL
   ```

### Error: "API key invalid"

Tu `RESEND_API_KEY` no es correcta. Verifica:
1. Que copiaste la key completa (empieza con `re_`)
2. Que no hay espacios extra
3. Que está en el archivo `.env.local` correcto

---

## Recomendación final

Para **desarrollo/testing inmediato**: Usa la Opción 2 (dominio de prueba)

Para **producción**: Usa la Opción 1 (verificar dominio completo)

Si necesitas ayuda con DNS, consulta la documentación de tu proveedor o contacta a Resend en support@resend.com

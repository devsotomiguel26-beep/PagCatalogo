# 📧 Configuración de Gmail SMTP para Envío de Emails

## 🎯 Qué vas a lograr

Usar tu cuenta de Google Workspace (`noreply@diablosrojoscl.com`) para enviar emails automáticos desde la aplicación.

**Sin DNS, sin Resend, usando tu infraestructura existente.**

---

## 📋 Paso 1: Crear App Password en Google

### ¿Qué es un App Password?

Es una contraseña de 16 caracteres que le da a tu aplicación acceso para enviar emails sin usar tu contraseña real de Gmail. Es más seguro.

### Cómo crearlo:

1. **Ve a tu cuenta de Google**:
   - Abre: https://myaccount.google.com/
   - Inicia sesión con tu cuenta de Google Workspace (`tu-usuario@diablosrojoscl.com`)

2. **Habilita verificación en 2 pasos** (si no la tienes):
   - En el menú izquierdo: **Security**
   - Busca: **2-Step Verification**
   - Click en **Get Started** y sigue los pasos
   - **IMPORTANTE**: Sin 2-Step Verification, no puedes crear App Passwords

3. **Crea el App Password**:
   - Vuelve a **Security**
   - Scroll down hasta **2-Step Verification**
   - En la parte inferior, busca: **App passwords**
   - Click en **App passwords**

   Si no ves "App passwords", puede estar en:
   - https://myaccount.google.com/apppasswords (directo)

4. **Genera la contraseña**:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Nombre: `Diablos Rojos Foto App`
   - Click **Generate**

5. **Copia la contraseña de 16 caracteres**:
   - Se verá algo como: `abcd efgh ijkl mnop`
   - **Cópiala** (la necesitarás en el siguiente paso)
   - **IMPORTANTE**: Solo se muestra una vez, guárdala en lugar seguro

---

## 📋 Paso 2: Configurar Variables de Entorno

Agrega estas líneas a tu archivo `.env.local`:

```bash
# Gmail SMTP (para envío de emails)
GMAIL_USER=noreply@diablosrojoscl.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Reemplaza**:
- `noreply@diablosrojoscl.com` → Tu email de Google Workspace que usarás para enviar
- `abcdefghijklmnop` → El App Password de 16 caracteres (sin espacios)

### Ejemplo completo de `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Gmail SMTP (NUEVO)
GMAIL_USER=noreply@diablosrojoscl.com
GMAIL_APP_PASSWORD=abcdefghijklmnop

# Admin email (donde recibes notificaciones)
ADMIN_EMAIL=tu-email@diablosrojoscl.com
```

---

## 📋 Paso 3: Instalar Nodemailer

En tu terminal, ejecuta:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

---

## 📋 Paso 4: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Reinicia:
npm run dev
```

---

## ✅ Paso 5: Probar el Envío

Una vez que haya creado los archivos necesarios:

1. Haz una solicitud de fotos en el catálogo público
2. Verifica que recibas el email de confirmación
3. Revisa los logs del servidor (no debe haber errores de Resend)

---

## 🔍 Verificación

### ✅ Checklist:

- [ ] Tienes cuenta de Google Workspace activa
- [ ] Verificación en 2 pasos habilitada
- [ ] App Password creado (16 caracteres)
- [ ] Variables agregadas a `.env.local`
- [ ] Nodemailer instalado
- [ ] Servidor reiniciado

### ✅ Cómo saber si funciona:

1. **En los logs del servidor** (terminal donde corre `npm run dev`):
   ```
   ✓ Email sent successfully via Gmail SMTP
   ```

2. **En tu bandeja de entrada**:
   - Deberías recibir el email de prueba
   - From: `Diablos Rojos Foto <noreply@diablosrojoscl.com>`
   - No debe estar en spam

3. **Sin errores**:
   - No debe aparecer "Resend domain not verified"
   - No debe aparecer "Authentication failed"

---

## ⚠️ Troubleshooting (Solución de Problemas)

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Causa**: App Password incorrecto o 2-Step Verification no habilitada.

**Solución**:
1. Verifica que copiaste bien el App Password (16 caracteres, sin espacios)
2. Verifica que 2-Step Verification esté habilitada
3. Genera un nuevo App Password

### Error: "Missing credentials for PLAIN"

**Causa**: Variables de entorno no cargadas.

**Solución**:
1. Verifica que `.env.local` tenga las variables
2. Reinicia el servidor: `npm run dev`
3. Verifica que no haya typos en los nombres de variables

### Los emails van a spam

**Causa**: Primera vez enviando desde esta cuenta.

**Solución**:
1. Marca como "No spam" manualmente las primeras veces
2. Pide a tus clientes hacer lo mismo
3. Después de ~10 emails, Google mejora tu reputación

### Error: "Daily user sending quota exceeded"

**Causa**: Superaste 500 emails/día.

**Solución**:
1. Espera 24 horas
2. Si es recurrente, considera Gmail API o SendGrid

---

## 📊 Límites de Gmail SMTP

| Límite | Valor |
|--------|-------|
| Emails por día | 500 |
| Emails por mensaje | 500 destinatarios |
| Tamaño máximo | 25 MB |
| Attachments | Sí |

**Para tu caso** (20 galerías, 50 clientes):
- Máximo ~100 emails/mes
- ✅ **Más que suficiente**

---

## 🔐 Seguridad

### ✅ Buenas Prácticas:

1. **Nunca compartas** tu App Password
2. **No lo subas a Git** (está en `.env.local` que está en `.gitignore`)
3. **Usa cuentas específicas**: `noreply@` es ideal
4. **Revoca passwords** que no uses
5. **Monitorea actividad** en Google Account → Security

### 🔍 Revisar actividad:

- Ve a: https://myaccount.google.com/device-activity
- Deberías ver "Diablos Rojos Foto App" cuando envías emails

---

## 🎉 ¡Listo!

Una vez completados todos los pasos:
- ✅ Emails se envían desde `noreply@diablosrojoscl.com`
- ✅ Sin configuración DNS
- ✅ Gratis (incluido en Google Workspace)
- ✅ 500 emails/día de límite
- ✅ Alta deliverability (Google infrastructure)

**Próximo**: Crear cuenta `noreply@diablosrojoscl.com` si no existe

Si no tienes una cuenta `noreply@`, créala en Google Workspace Admin:
1. Admin console → Users → Add new user
2. Email: `noreply@diablosrojoscl.com`
3. Password: (genera uno seguro)
4. ✅ Habilita 2-Step Verification
5. ✅ Crea App Password

O usa cualquier cuenta existente de Google Workspace.

---

¿Necesitas ayuda con algún paso? ¡Avísame! 📧

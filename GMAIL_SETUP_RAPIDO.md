# ⚡ Setup Rápido - Gmail SMTP

## ✅ LO QUE ACABO DE HACER

- ✅ Creado servicio de email con Nodemailer (`lib/emailService.ts`)
- ✅ Actualizado API de solicitudes para usar Gmail SMTP
- ✅ Actualizado `.env.local.example`
- ✅ Creado guía completa (`GMAIL_SETUP.md`)

---

## 🚀 TUS PASOS AHORA (5-10 minutos)

### Paso 1: Instalar Nodemailer

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Paso 2: Crear App Password en Google

1. **Ve a**: https://myaccount.google.com/apppasswords

2. **Si no ves la página**:
   - Primero habilita 2-Step Verification: https://myaccount.google.com/security
   - Luego vuelve al link de arriba

3. **Crear password**:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Nombre: `Diablos Rojos Foto`
   - Click **Generate**

4. **Copiar el password**:
   - Aparecerá algo como: `abcd efgh ijkl mnop`
   - Cópialo (SIN espacios): `abcdefghijklmnop`

### Paso 3: Agregar a .env.local

Abre tu archivo `.env.local` y agrega:

```bash
# Gmail SMTP
GMAIL_USER=noreply@diablosrojoscl.com
GMAIL_APP_PASSWORD=abcdefghijklmnop

# Admin email (donde recibes notificaciones)
ADMIN_EMAIL=tu-email@diablosrojoscl.com
```

**Reemplaza**:
- `noreply@diablosrojoscl.com` → Tu email de Google Workspace
- `abcdefghijklmnop` → El App Password que copiaste
- `tu-email@diablosrojoscl.com` → Tu email personal para recibir notificaciones

### Paso 4: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

Deberías ver en la consola:
```
✅ Gmail SMTP configurado correctamente y listo para enviar emails
```

### Paso 5: Probar

1. Ve al catálogo público
2. Marca fotos como favoritas
3. Envía una solicitud
4. **Verifica**:
   - El cliente recibe email de confirmación
   - Tú (admin) recibes notificación
   - Logs muestran: `✅ Emails enviados exitosamente via Gmail SMTP`

---

## ⚠️ Si algo falla

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solución**:
1. Verifica que copiaste bien el App Password (16 caracteres, sin espacios)
2. Verifica que 2-Step Verification esté habilitada en Google
3. Genera un nuevo App Password

### Error: "Missing credentials"

**Solución**:
1. Verifica que `.env.local` tenga las variables correctas
2. Reinicia el servidor: `npm run dev`

### Los emails NO llegan

**Solución**:
1. Revisa spam
2. Verifica los logs del servidor (deben mostrar "Email enviado exitosamente")
3. Verifica que el email de destino sea correcto

---

## ✅ Checklist Final

Antes de probar:

- [ ] Nodemailer instalado (`npm list nodemailer` muestra versión)
- [ ] App Password creado en Google
- [ ] Variables agregadas a `.env.local`
- [ ] Servidor reiniciado
- [ ] Logs muestran: "Gmail SMTP configurado correctamente"

Para probar:

- [ ] Solicitud enviada desde catálogo
- [ ] Cliente recibe email de confirmación
- [ ] Admin recibe notificación
- [ ] Emails NO están en spam
- [ ] Logs muestran éxito

---

## 🎉 ¡Listo!

Una vez que funcione:
- ✅ Emails se envían desde tu dominio
- ✅ Sin configuración DNS
- ✅ Gratis (Google Workspace)
- ✅ 500 emails/día de límite
- ✅ Sin dependencias de Resend

**Próximo paso**: Si todo funciona, podemos implementar el botón "Enviar Fotos" en el admin panel.

---

¿Necesitas ayuda? Revisa `GMAIL_SETUP.md` para guía detallada.

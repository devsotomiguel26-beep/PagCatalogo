# 🚀 Guía Completa: Deploy en Vercel con Dominio Personalizado

## Índice
1. [Preparar Código para GitHub](#parte-1-preparar-código-para-github)
2. [Crear Cuenta en Vercel](#parte-2-crear-cuenta-en-vercel)
3. [Deploy en Vercel](#parte-3-deploy-en-vercel)
4. [Configurar Variables de Entorno](#parte-4-configurar-variables-de-entorno)
5. [Configurar Dominio Personalizado](#parte-5-configurar-dominio-personalizado)
6. [Configurar DNS en Hostinger](#parte-6-configurar-dns-en-hostinger)
7. [Verificación Final](#parte-7-verificación-final)

---

## PARTE 1: Preparar Código para GitHub

### Paso 1.1: Inicializar Git (si no lo has hecho)

```bash
cd /Users/mgl26/Desarrollo/PagCatalogo

# Verificar si ya es un repositorio git
git status

# Si dice "not a git repository", inicializa:
git init
```

### Paso 1.2: Hacer el primer commit

```bash
# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Diablos Rojos Foto App"
```

**Nota:** Si Git te pide configurar tu identidad:
```bash
git config --global user.email "tu-email@diablosrojoscl.com"
git config --global user.name "Tu Nombre"
```

### Paso 1.3: Crear repositorio en GitHub

1. Ve a **https://github.com**
2. **Sign in** (o crea cuenta si no tienes)
3. Click en **"+"** (arriba derecha) → **"New repository"**
4. Llena los datos:
   - **Repository name:** `diablos-rojos-foto` (o el nombre que prefieras)
   - **Description:** `Portal de galerías fotográficas - Diablos Rojos`
   - **Privacy:**
     - **Private** ✅ (recomendado - solo tú lo ves)
     - **Public** ⚠️ (todos pueden ver el código)
   - **NO marques:** "Initialize this repository with a README"
5. Click **"Create repository"**

### Paso 1.4: Subir código a GitHub

GitHub te mostrará comandos. Usa estos:

```bash
# Agregar el repositorio remoto (reemplaza con TU URL)
git remote add origin https://github.com/TU-USUARIO/diablos-rojos-foto.git

# Cambiar a branch main
git branch -M main

# Subir el código
git push -u origin main
```

**Si te pide credenciales:**
- Usuario: tu nombre de usuario de GitHub
- Contraseña: **NO uses tu contraseña normal**
- Usa un **Personal Access Token** (GitHub te guiará para crearlo)

✅ **Verificación:** Ve a tu repositorio en GitHub y verás todos tus archivos.

---

## PARTE 2: Crear Cuenta en Vercel

### Paso 2.1: Ir a Vercel

1. Ve a **https://vercel.com**
2. Click en **"Sign Up"** (o **"Get Started"**)

### Paso 2.2: Registrarse con GitHub

1. Click en **"Continue with GitHub"**
2. Te redirigirá a GitHub
3. Click **"Authorize Vercel"**
4. Vercel te pedirá acceso a tus repositorios
5. Selecciona:
   - **"All repositories"** (más fácil), o
   - **"Only select repositories"** → selecciona `diablos-rojos-foto`
6. Click **"Install & Authorize"**

✅ Ya tienes cuenta en Vercel y está conectada con GitHub.

---

## PARTE 3: Deploy en Vercel

### Paso 3.1: Importar proyecto

1. En Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Verás tu repositorio `diablos-rojos-foto`
3. Click **"Import"**

### Paso 3.2: Configurar proyecto

Vercel detectará automáticamente que es Next.js y mostrará:

- **Framework Preset:** Next.js ✅ (auto-detectado)
- **Root Directory:** ./ ✅ (dejar así)
- **Build Command:** `next build` ✅ (dejar así)
- **Output Directory:** .next ✅ (dejar así)
- **Install Command:** `npm install` ✅ (dejar así)

**NO hagas click en "Deploy" todavía**, primero necesitas configurar las variables de entorno.

### Paso 3.3: Agregar Variables de Entorno

**IMPORTANTE:** Debes agregar las variables de `.env.local` en Vercel.

1. En la sección **"Environment Variables"**, agrega una por una:

#### Variables que DEBES agregar:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
# Valor: tu URL de Supabase (ej: https://xxxxx.supabase.co)

NEXT_PUBLIC_SUPABASE_ANON_KEY
# Valor: tu anon key de Supabase

SUPABASE_SERVICE_ROLE_KEY
# Valor: tu service role key de Supabase

# Gmail SMTP
GMAIL_USER
# Valor: noreply@diablosrojoscl.com (o tu email)

GMAIL_APP_PASSWORD
# Valor: tu App Password de Google (16 caracteres)

ADMIN_EMAIL
# Valor: tu email personal para recibir notificaciones
```

**Cómo agregar cada variable:**
1. En el campo **"Key"**, escribe el nombre (ej: `NEXT_PUBLIC_SUPABASE_URL`)
2. En el campo **"Value"**, pega el valor
3. En **"Environment"**, deja seleccionados: Production, Preview, Development
4. Click **"Add"**
5. Repite para todas las variables

**⚠️ IMPORTANTE:**
- NO compartas estas variables públicamente
- Cópialas exactamente de tu archivo `.env.local`
- Verifica que no haya espacios extra

### Paso 3.4: Deploy

1. Una vez agregadas todas las variables, click **"Deploy"**
2. Vercel empezará a construir tu aplicación
3. Verás logs en tiempo real (proceso toma 2-5 minutos)
4. Espera a que diga **"✓ Deployment Complete"**

✅ Tu aplicación está desplegada en: `https://diablos-rojos-foto-xxxxx.vercel.app`

### Paso 3.5: Verificar deployment

1. Click en **"Visit"** o copia la URL
2. Verifica que tu aplicación funcione:
   - ✅ Home page carga correctamente
   - ✅ Puedes ver galerías
   - ✅ Puedes acceder al admin (si tienes datos)
   - ✅ No hay errores en consola

**Si algo falla:**
- Ve a la pestaña **"Logs"** en Vercel
- Lee el error y revisa que las variables de entorno estén correctas

---

## PARTE 4: Configurar Variables de Entorno (Detalle)

### Dónde encontrar tus valores de Supabase:

1. Ve a **https://supabase.com**
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRETO)

### Dónde encontrar tu Gmail App Password:

1. Ve a **https://myaccount.google.com/apppasswords**
2. Si no existe, crea uno:
   - App: Mail
   - Device: Other (Custom name)
   - Name: Diablos Rojos Foto Vercel
3. Copia el password (16 caracteres, sin espacios)

---

## PARTE 5: Configurar Dominio Personalizado

### Paso 5.1: Agregar dominio en Vercel

1. En tu proyecto de Vercel, ve a **"Settings"**
2. En el menú izquierdo, click **"Domains"**
3. En el campo de texto, escribe: `fotos.diablosrojoscl.com`
4. Click **"Add"**

### Paso 5.2: Copiar configuración DNS

Vercel te mostrará qué configuración DNS necesitas:

```
Type: CNAME
Name: fotos
Value: cname.vercel-dns.com
```

**O puede mostrarte:**
```
Type: A
Name: fotos
Value: 76.76.21.21
```

**Copia estos valores**, los necesitarás en el siguiente paso.

**NO cierres esta ventana todavía**, déjala abierta para referencia.

---

## PARTE 6: Configurar DNS en Hostinger

### Paso 6.1: Acceder al panel de Hostinger

1. Ve a **https://hpanel.hostinger.com**
2. Inicia sesión con tus credenciales
3. En el dashboard, busca **"Dominios"**
4. Click en **diablosrojoscl.com**

### Paso 6.2: Acceder a gestión DNS

1. En el menú del dominio, busca **"DNS / Zona DNS"** o **"DNS Zone"**
2. Click para acceder a la gestión de registros DNS

### Paso 6.3: Agregar registro CNAME

**Si Vercel te pidió CNAME:**

1. Click en **"Agregar registro"** o **"Add Record"**
2. Selecciona tipo: **CNAME**
3. Llena los campos:
   - **Nombre / Name / Host:** `fotos`
   - **Apunta a / Points to / Value:** `cname.vercel-dns.com`
   - **TTL:** 14400 (o dejar por defecto)
4. Click **"Guardar"** o **"Add Record"**

**Si Vercel te pidió registro A:**

1. Click en **"Agregar registro"** o **"Add Record"**
2. Selecciona tipo: **A**
3. Llena los campos:
   - **Nombre / Name / Host:** `fotos`
   - **Apunta a / Points to / Value:** `76.76.21.21` (la IP que Vercel te dio)
   - **TTL:** 14400 (o dejar por defecto)
4. Click **"Guardar"** o **"Add Record"**

### Paso 6.4: Verificar registro

Después de guardar, deberías ver el nuevo registro en la lista:

```
Tipo    Nombre    Valor
CNAME   fotos     cname.vercel-dns.com
```

✅ Configuración DNS completada.

---

## PARTE 7: Verificación Final

### Paso 7.1: Esperar propagación DNS

- **Tiempo:** Entre 5 minutos y 2 horas
- **Promedio:** 15-30 minutos

**Mientras esperas:**
- Vercel mostrará "Pending" o "Invalid Configuration"
- Esto es normal, solo espera

### Paso 7.2: Verificar en Vercel

1. Vuelve a Vercel → Settings → Domains
2. Refresca la página cada 5-10 minutos
3. Cuando esté listo verás:
   - ✅ **"Valid Configuration"**
   - ✅ SSL Certificate: **"Active"** (se genera automáticamente)

### Paso 7.3: Probar tu dominio

1. Abre en navegador: **https://fotos.diablosrojoscl.com**
2. Verifica:
   - ✅ La página carga
   - ✅ Tiene certificado SSL (candado verde)
   - ✅ Todo funciona correctamente

### Paso 7.4: Verificar propagación DNS (opcional)

Usa herramientas online para verificar:
- https://dnschecker.org
- Ingresa: `fotos.diablosrojoscl.com`
- Verás si el DNS se propagó globalmente

---

## 🎉 ¡LISTO!

Tu aplicación ya está funcionando en: **https://fotos.diablosrojoscl.com**

### URLs finales:

- 🌐 **Producción:** https://fotos.diablosrojoscl.com
- 🌐 **Vercel:** https://diablos-rojos-foto-xxxxx.vercel.app (también funciona)
- 💻 **Dashboard Vercel:** https://vercel.com/dashboard

---

## 📝 Comandos de Actualización

### Para actualizar tu aplicación después de hacer cambios:

```bash
cd /Users/mgl26/Desarrollo/PagCatalogo

# Hacer cambios en tu código...

# Commit los cambios
git add .
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push origin main
```

**¡Automático!** Vercel detecta el push y hace deploy automáticamente en 1-2 minutos.

---

## ⚠️ Troubleshooting

### Problema: "Build failed"

**Solución:**
1. Ve a Vercel → Deployments → Click en el deployment fallido
2. Lee los logs de error
3. Usualmente es por:
   - Variables de entorno faltantes
   - Error de sintaxis en código
4. Corrige el error y haz push de nuevo

### Problema: "Domain not verified"

**Solución:**
1. Verifica que agregaste el registro DNS correctamente en Hostinger
2. Espera 30 minutos más
3. En Vercel → Domains → Click "Refresh"
4. Si persiste, elimina el dominio y agrégalo de nuevo

### Problema: "500 Internal Server Error"

**Solución:**
1. Ve a Vercel → Deployments → Click en el deployment actual
2. Ve a la pestaña "Functions" o "Logs"
3. Lee el error
4. Usualmente es por:
   - Variables de entorno incorrectas
   - Error de conexión a Supabase
5. Verifica las variables en Settings → Environment Variables

### Problema: Emails no funcionan en producción

**Solución:**
1. Verifica que agregaste las variables de Gmail en Vercel
2. Ve a Settings → Environment Variables
3. Verifica que `GMAIL_USER` y `GMAIL_APP_PASSWORD` estén correctos
4. Re-deploy: Deployments → Click en "..." → "Redeploy"

---

## 📱 Próximos Pasos

### Agregar enlace desde tu sitio principal

En tu sitio informativo (Hostinger), agrega un botón/enlace:

```html
<a href="https://fotos.diablosrojoscl.com">Ver Galerías de Fotos</a>
```

### Actualizar enlaces internos

Si tienes enlaces hardcodeados en tu app, actualízalos:

```tsx
// Antes
const siteUrl = 'http://localhost:3000';

// Después
const siteUrl = 'https://fotos.diablosrojoscl.com';
```

---

## 🔒 Seguridad

### Variables de entorno:
- ✅ Nunca las compartas públicamente
- ✅ No las incluyas en código
- ✅ No las subas a GitHub
- ✅ Solo en Vercel y `.env.local`

### Repositorio:
- ✅ Recomendado: mantenerlo **Private**
- ⚠️ Si es público, asegúrate que `.env.local` esté en `.gitignore`

---

## 💰 Costos

### Vercel - Plan Hobby (actual):
- ✅ **$0/mes**
- ✅ 100 GB bandwidth
- ✅ Unlimited deploys
- ✅ Automatic SSL
- ✅ Suficiente para tu caso de uso

### Si necesitas más:
- Vercel Pro: $20/mes (1 TB bandwidth, más features)

---

## 📊 Monitoreo

### Ver analytics:
1. Vercel Dashboard → Tu proyecto
2. Pestaña "Analytics"
3. Ve visitas, performance, etc.

### Ver logs en tiempo real:
1. Vercel Dashboard → Tu proyecto
2. Pestaña "Logs"
3. Ve requests, errores, etc.

---

## ✅ Checklist Final

Antes de considerar que todo está listo:

- [ ] Código subido a GitHub
- [ ] Deploy exitoso en Vercel
- [ ] Todas las variables de entorno configuradas
- [ ] Dominio `fotos.diablosrojoscl.com` agregado en Vercel
- [ ] DNS configurado en Hostinger
- [ ] SSL activo (candado verde)
- [ ] Página funciona en dominio personalizado
- [ ] Admin panel funciona
- [ ] Emails funcionan
- [ ] Subida de fotos funciona
- [ ] Solicitudes funcionan
- [ ] Envío de fotos funciona

---

## 🆘 Ayuda

Si tienes problemas:
1. Revisa la sección Troubleshooting arriba
2. Revisa los logs en Vercel
3. Contacta soporte de Vercel (muy buenos y rápidos)
4. Documentación: https://vercel.com/docs

---

**¡Éxito con tu deploy! 🚀**

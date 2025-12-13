# Diablos Rojos - Sistema de Venta de Fotografías Deportivas

## 📋 Descripción General

Plataforma web para venta de fotografías deportivas de la academia de fútbol infantil "Diablos Rojos". Los apoderados pueden explorar galerías de partidos/torneos, seleccionar fotos de sus hijos y comprarlas mediante Flow (pasarela de pago chilena). Después del pago exitoso, reciben las fotos por correo electrónico.

**URL Producción:** https://fotos.diablosrojoscl.com
**Framework:** Next.js 14 (App Router) con TypeScript
**Despliegue:** Vercel
**Diseño:** Minimalista inspirado en Pixieset con colores Diablos Rojos (#dc2626)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** (App Router, Server Components, Server Actions)
- **React 18** con TypeScript
- **Tailwind CSS** - Diseño minimalista
- **Next/Image** - Optimización automática (WebP/AVIF)
- **Inter Font** (Google Fonts) - Pesos: 300, 400, 500, 600, 700

### Backend
- **Next.js API Routes** (Serverless Functions)
- **Supabase** (PostgreSQL + Storage)
- **Flow Chile** - Pasarela de pagos (HMAC SHA256 signatures)
- **Resend** - Servicio de emails transaccionales

### Servicios Externos
- **Supabase**
  - PostgreSQL Database (Row Level Security deshabilitado para admin)
  - Storage para imágenes (bucket: `gallery-photos`)
  - URL: `https://<project-id>.supabase.co`

- **Flow Chile**
  - API Key y Secret Key
  - Webhook URL: `https://fotos.diablosrojoscl.com/api/webhooks/flow`
  - Firma HMAC SHA256 (opcional temporalmente - Flow no la envía)
  - Precio por foto: $1500 CLP

- **Resend**
  - API Key configurada
  - Dominio verificado: `diablosrojoscl.com`
  - Email remitente: `noreply@diablosrojoscl.com`

---

## 🗄️ Arquitectura de Base de Datos

### Tabla: `categories`
```sql
id: uuid (PK)
name: text (ej: "Sub-10", "Sub-12", "Femenino")
slug: text (ej: "sub-10")
created_at: timestamp
```

### Tabla: `galleries`
```sql
id: uuid (PK)
title: text (ej: "Partido vs Los Leones - Sub 10")
slug: text (generado automáticamente)
category_id: uuid (FK → categories.id)
event_type: text ("partido" | "torneo" | "evento" | "entrenamiento")
tournament: text (opcional, nombre del torneo)
event_date: date
location: text (opcional)
status: text ("draft" | "published")
created_at: timestamp
updated_at: timestamp
```

### Tabla: `photos`
```sql
id: uuid (PK)
gallery_id: uuid (FK → galleries.id)
storage_path: text (path de foto CON marca de agua - galería pública)
original_path: text (path de foto SIN marca de agua - post-compra)
public_url: text (URL pública de la imagen CON marca de agua)
position: integer (orden de visualización, nullable)
created_at: timestamp
```

### Tabla: `photo_requests`
```sql
id: uuid (PK)
gallery_id: uuid (FK → galleries.id)
photo_ids: uuid[] (array de IDs de fotos seleccionadas)
client_name: text (nombre del apoderado)
client_email: text
client_phone: text
child_name: text (nombre del niño/a en las fotos)
status: text ("pending" | "paid" | "sent" | "cancelled")
total_amount: integer (en CLP, calculado: foto_count * 1500)
flow_token: text (nullable, token de Flow)
flow_payment_data: jsonb (nullable, respuesta de Flow)
created_at: timestamp
updated_at: timestamp
```

**Relaciones:**
- `galleries.category_id` → `categories.id`
- `photos.gallery_id` → `galleries.id`
- `photo_requests.gallery_id` → `galleries.id`

---

## 📁 Estructura del Proyecto

```
PagCatalogo/
├── app/
│   ├── layout.tsx                    # Layout raíz con PageTransition
│   ├── page.tsx                      # Homepage (hero minimalista)
│   ├── galerias/
│   │   ├── page.tsx                  # Listado de galerías (filtros)
│   │   └── [slug]/
│   │       └── page.tsx              # Galería individual (selección fotos)
│   ├── pago/
│   │   ├── exitoso/page.tsx          # Confirmación de pago exitoso
│   │   └── fallido/page.tsx          # Pago fallido
│   └── api/
│       ├── payment/
│       │   └── create/route.ts       # Crear orden de pago en Flow
│       ├── webhooks/
│       │   └── flow/route.ts         # Webhook de confirmación Flow
│       ├── send-request-email/
│       │   └── route.ts              # Enviar email de confirmación
│       └── test-email/
│           └── route.ts              # Test endpoint para Resend
├── components/
│   ├── Header.tsx                    # Header minimalista (sticky)
│   ├── Footer.tsx                    # Footer simple
│   ├── PhotoGrid.tsx                 # Grid fotos con lazy loading
│   ├── Lightbox.tsx                  # Visor full-screen (fondo blanco)
│   ├── GalleryCard.tsx               # Card de galería (sin bordes/sombras)
│   ├── FloatingCartButton.tsx        # Botón flotante contador selección
│   ├── RequestPhotosModal.tsx        # Modal formulario solicitud
│   ├── FavoriteButton.tsx            # Botón favorito/selección
│   ├── LoadingSpinner.tsx            # Spinner de carga
│   ├── Toast.tsx                     # Notificaciones toast
│   ├── PageTransition.tsx            # Transiciones de página (fade 300ms)
│   └── skeletons/
│       ├── GalleryCardSkeleton.tsx   # Loading skeleton cards
│       └── PhotoGridSkeleton.tsx     # Loading skeleton grid
├── lib/
│   ├── supabaseClient.ts             # Cliente Supabase
│   ├── emailService.ts               # Servicio Resend (reemplazó nodemailer)
│   └── flowClient.ts                 # Cliente Flow (firma HMAC)
├── styles/
│   └── globals.css                   # Estilos globales (minimalista)
├── public/
│   └── (assets estáticos)
├── .env.local                        # Variables de entorno
├── next.config.js                    # Config Next.js (image optimization)
├── tailwind.config.ts                # Config Tailwind (colores Diablos Rojos)
├── package.json                      # Dependencies
└── PROJECT_CONTEXT.md                # Este archivo
```

---

## 🎨 Filosofía de Diseño

### Principios (Inspirado en Pixieset)
1. **95% blanco/negro/gris + 5% rojo** - Color usado estratégicamente
2. **Fotografía como protagonista** - Diseño invisible
3. **Tipografía light** - Solo Inter font (300, 400, 500, 600, 700)
4. **Sin elementos pesados** - Sin gradientes, sombras exageradas, animaciones flotantes
5. **Espaciado generoso** - Breathing room entre elementos
6. **Hover sutil** - `opacity: 0.9`, `transform: scale(1.01)`

### Colores Clave
```css
--devil-red: #dc2626        /* Rojo principal (CTAs, hover) */
--devil-red-dark: #991b1b   /* Rojo oscuro (hover sobre CTAs) */
--background: #ffffff       /* Fondo blanco */
--foreground: #1a1a1a       /* Texto principal */
--text-secondary: #666666   /* Texto secundario */
```

### Componentes Clave
- **Header:** Sticky, fondo blanco, borde inferior sutil
- **GalleryCard:** Sin bordes, sin sombras, texto debajo de imagen
- **PhotoGrid:** Checkbox selección (no corazón), blur placeholders
- **Lightbox:** Fondo blanco (no negro), navegación minimalista
- **Botones:** Rojo #dc2626, hover #991b1b, bordes redondeados sutiles

---

## 🔄 Flujo de Usuario Completo

### 1. Exploración de Galerías
```
1. Usuario entra a /galerias
2. Ve grid de galerías (filtros por categoría/tipo evento)
3. Click en galería → redirige a /galerias/[slug]
```

### 2. Selección de Fotos
```
1. Usuario ve grid de fotos de la galería
2. Click en checkbox (esquina superior izquierda) para seleccionar
3. Contador flotante muestra cantidad seleccionada
4. Click en foto abre lightbox (puede navegar y seleccionar)
5. Favoritos se guardan en localStorage: `favorites_[gallery_id]`
```

### 3. Solicitud de Compra
```
1. Click en botón flotante "Solicitar X fotos"
2. Se abre modal con formulario:
   - Nombre del apoderado
   - Email
   - Teléfono
   - Nombre del niño/a
3. Submit → crea registro en `photo_requests` (status: 'pending')
4. Envía email de confirmación al apoderado (Resend)
5. Crea orden de pago en Flow (POST /api/payment/create)
6. Redirige a Flow para pagar
```

### 4. Proceso de Pago (Flow)
```
1. Usuario paga en Flow (tarjeta/transferencia)
2. Flow redirige a:
   - Éxito: /pago/exitoso?token=XXX
   - Fallo: /pago/fallido?token=XXX
3. Flow envía webhook a /api/webhooks/flow (POST)
```

### 5. Webhook Flow y Entrega de Fotos
```
1. Webhook recibe parámetros: { token, s (opcional) }
2. Valida firma HMAC SHA256 SI está presente
3. Consulta estado del pago en Flow (GET /api/payment/getStatus)
4. Si status === 2 (pagado):
   - Actualiza photo_request: status = 'paid', flow_payment_data
   - Envía email con links de descarga de fotos (Resend)
   - Actualiza photo_request: status = 'sent'
5. Responde 200 OK a Flow
```

---

## 🔧 Variables de Entorno

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Flow Chile
FLOW_API_KEY=<api-key>
FLOW_SECRET_KEY=<secret-key>
FLOW_API_URL=https://www.flow.cl/api  # Producción
# FLOW_API_URL=https://sandbox.flow.cl/api  # Sandbox

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@diablosrojoscl.com

# URLs
NEXT_PUBLIC_BASE_URL=https://fotos.diablosrojoscl.com
```

---

## 🔐 Seguridad y Autenticación

### Flow - Validación de Firma HMAC
```typescript
// lib/flowClient.ts
function verifyFlowSignature(params: Record<string, any>, signature: string): boolean {
  const keys = Object.keys(params).sort();
  const toSign = keys.map(key => `${key}${params[key]}`).join('');
  const hash = crypto
    .createHmac('sha256', process.env.FLOW_SECRET_KEY!)
    .update(toSign)
    .digest('hex');
  return hash === signature;
}
```

**IMPORTANTE:** La firma (`s`) es opcional temporalmente porque Flow en producción no la envía. Si está presente, se valida. Si no, solo se loguea warning.

### Row Level Security (RLS)
- **Deshabilitado** para todas las tablas (acceso desde admin panel y API)
- En futuro: habilitar RLS y usar service_role key en backend

---

## 📧 Sistema de Emails (Resend)

### Migración: Nodemailer → Resend
**Problema:** Nodemailer (CommonJS) incompatible con Next.js 14 ES Modules en Vercel serverless.
**Solución:** Migración completa a Resend API.

### Emails Enviados

#### 1. Confirmación de Solicitud (Antes de Pago)
```typescript
// Trigger: POST /api/send-request-email
// Destinatario: Apoderado
// Asunto: "Solicitud de fotos recibida - Diablos Rojos"
// Contenido:
//   - Resumen de solicitud
//   - Cantidad de fotos
//   - Total a pagar
//   - Instrucciones para completar pago
```

#### 2. Entrega de Fotos (Después de Pago)
```typescript
// Trigger: Webhook Flow (pago exitoso)
// Destinatario: Apoderado
// Asunto: "¡Tus fotos están listas! - Diablos Rojos"
// Contenido:
//   - Confirmación de pago
//   - Links de descarga de cada foto
//   - Instrucciones de descarga
//   - Validez de links
```

### Configuración Resend
1. Dominio verificado: `diablosrojoscl.com`
2. DNS configurados (MX, TXT, DKIM)
3. Email remitente: `noreply@diablosrojoscl.com`
4. Puede enviar a cualquier dirección (producción)

---

## 💳 Integración Flow Chile

### Endpoints Flow Usados

#### 1. Crear Pago
```typescript
POST https://www.flow.cl/api/payment/create
Headers: {
  'Content-Type': 'application/x-www-form-urlencoded'
}
Body: {
  apiKey: string
  commerceOrder: string  // photo_request.id
  subject: string        // "Fotos galería: [título]"
  amount: number         // cantidad * 1500
  email: string          // client_email
  urlConfirmation: string // webhook URL
  urlReturn: string      // /pago/exitoso
  s: string              // HMAC signature
}
Response: {
  url: string           // URL para redirigir al usuario
  token: string         // Token de la orden
  flowOrder: number     // ID interno de Flow
}
```

#### 2. Obtener Estado de Pago
```typescript
GET https://www.flow.cl/api/payment/getStatus?apiKey=XXX&token=XXX&s=XXX
Response: {
  status: number        // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  amount: number
  email: string
  paymentData: {
    date: string
    media: string       // "Webpay", "Transferencia", etc.
    ...
  }
}
```

### Webhook Flow
```typescript
// POST /api/webhooks/flow
// Content-Type: application/x-www-form-urlencoded
// Body: token=XXX&s=YYY (firma opcional)

// Proceso:
// 1. Validar firma si presente
// 2. Consultar estado con getStatus
// 3. Si pagado: actualizar DB + enviar fotos
// 4. Responder 200 OK (obligatorio)
```

### Precios
- **Por foto:** $1500 CLP
- **Comisión Flow:** ~3.49% + IVA (cuentas personales)
- **Pago instantáneo:** Opcional (2-3 días sin costo)

---

## 💧 Sistema de Marcas de Agua

### Arquitectura de Doble Versión

El sistema procesa y almacena **dos versiones de cada foto**:

1. **Versión Catálogo** (CON marca de agua)
   - Mostrada en galería pública
   - Logo Diablos Rojos al 50% opacidad, centrado
   - Procesada con Sharp (resize + watermark)
   - Guardada en: `galleries/{id}/{timestamp}-catalog.jpg`
   - Campo BD: `storage_path` + `public_url`

2. **Versión Original** (SIN marca de agua)
   - Solo enviada post-compra por email
   - Alta calidad (quality: 95)
   - Guardada en: `galleries/{id}/originals/{timestamp}-original.jpg`
   - Campo BD: `original_path`

### Flujo de Procesamiento

```typescript
// 1. Cliente sube foto → /api/upload-photo
POST /api/upload-photo
Body: FormData { file: File, galleryId: string }

// 2. Server procesa (lib/watermark.ts)
- processOriginal(buffer)      → Alta calidad, sin watermark
- processForCatalog(buffer)    → Resize 1920x1080 + watermark

// 3. Subida a Supabase Storage
- Sube original a: galleries/{id}/originals/{name}-original.jpg
- Sube catálogo a: galleries/{id}/{name}-catalog.jpg

// 4. Registro en BD
INSERT INTO photos (gallery_id, storage_path, original_path, public_url)
```

### Configuración de Marca de Agua

```typescript
// lib/watermark.ts - addWatermark()
{
  opacity: 50,        // 50% transparente
  position: 'center', // Centrado en diagonal
  scale: 0.5         // 50% del ancho de la imagen
}
```

**Requisitos del Logo:**
- Archivo: `/public/watermark/logo.png`
- Formato: PNG con transparencia
- Tamaño: 1000px - 2000px de ancho
- Fondo: Transparente

### Entrega Post-Compra

```typescript
// lib/photoDelivery.ts - generateDownloadLinks()
// Genera signed URLs de las fotos ORIGINALES (sin watermark)
const { data } = await supabase.storage
  .from('gallery-images')
  .createSignedUrl(photo.original_path, 7_DAYS);
```

---

## 🖼️ Optimización de Imágenes

### Next.js Image Component
```typescript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

### Configuración por Componente
```typescript
// PhotoGrid (thumbnails)
<Image quality={80} placeholder="blur" sizes="(max-width: 768px) 50vw, ..." />

// GalleryCard (covers)
<Image quality={80} sizes="(max-width: 768px) 100vw, ..." />

// Lightbox (full-size)
<Image quality={90} priority sizes="100vw" />
```

### Blur Placeholders
Base64 LQIP (Low Quality Image Placeholder) de 1x1px:
```typescript
blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
```

---

## 🎬 Animaciones y Transiciones

### Page Transitions
```typescript
// components/PageTransition.tsx
// Fade in/out 300ms entre rutas
// Trigger: usePathname() cambio
```

### CSS Animations
```css
/* globals.css */
.hover-subtle {
  transition: opacity 0.2s ease, transform 0.3s ease;
}
.hover-subtle:hover {
  opacity: 0.9;
  transform: scale(1.01);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Smooth Scroll
```css
html {
  scroll-behavior: smooth;
}
```

---

## 🐛 Problemas Resueltos

### 1. Nodemailer en Vercel
**Error:** `r.createTransporter is not a function`
**Causa:** CommonJS/ES Module incompatibilidad en serverless
**Solución:** Migración completa a Resend API

### 2. Resend 403 Forbidden
**Error:** "You can only send testing emails to your own email"
**Causa:** Dominio no verificado en Resend
**Solución:** Verificar dominio `diablosrojoscl.com` en Resend

### 3. Webhook Sin Firma
**Error:** "Token o firma faltante"
**Causa:** Flow en producción no envía parámetro `s` (firma)
**Solución:** Hacer firma opcional (validar si presente, continuar si ausente)

### 4. Diseño No Minimalista
**Error:** Usuario esperaba Pixieset, recibió diseño deportivo con gradientes
**Causa:** Malentendido de requerimientos
**Solución:** Rediseño completo eliminando Bebas Neue, gradientes, sombras premium

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor desarrollo (localhost:3000)

# Build y Deploy
npm run build            # Build producción
npm start                # Iniciar servidor producción
vercel --prod            # Deploy a Vercel producción

# Testing
# Test email Resend
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'

# Test Flow config
node -e "console.log('FLOW_API_KEY:', process.env.FLOW_API_KEY?.slice(0,10))"
```

---

## 🚀 Próximas Mejoras (Backlog)

### Funcionalidades
- [ ] Panel de administración completo (CRUD galerías/fotos)
- [ ] Búsqueda de fotos por nombre de niño
- [ ] Compartir galerías privadas con código de acceso
- [ ] Descarga de fotos en ZIP
- [ ] Marca de agua en previews (removida en compra)
- [ ] Sistema de cupones/descuentos
- [ ] Notificaciones push (nuevas galerías)

### Técnico
- [ ] Habilitar Row Level Security (RLS) en Supabase
- [ ] Implementar autenticación admin (NextAuth.js)
- [ ] CDN para imágenes (Cloudflare/Cloudinary)
- [ ] Tests unitarios (Jest) y E2E (Playwright)
- [ ] Monitoreo de errores (Sentry)
- [ ] Analytics (Vercel Analytics / Google Analytics)
- [ ] Hacer firma Flow obligatoria (cuando Flow la implemente)

### Diseño
- [ ] Modo oscuro (dark mode)
- [ ] Animaciones de carga más elaboradas
- [ ] Galería en modo mosaico (masonry layout)
- [ ] Comparación de fotos lado a lado

---

## 👥 Roles y Accesos

### Usuario Final (Apoderado)
- Explorar galerías públicas
- Seleccionar y comprar fotos
- Recibir fotos por email

### Administrador (Futuro)
- Crear/editar/eliminar galerías
- Subir fotos a Storage
- Ver solicitudes y pagos
- Gestionar categorías
- Configurar precios

---

## 📊 Métricas de Éxito

- **Conversión:** % de visitantes que completan compra
- **Ticket Promedio:** Cantidad promedio de fotos por pedido
- **Email Delivery Rate:** % emails entregados exitosamente
- **Tiempo de Carga:** < 3s para galerías con 50+ fotos
- **Lighthouse Score:** 90+ en Performance, Accessibility, Best Practices

---

## 📞 Soporte y Contacto

**Desarrollador:** [Tu nombre]
**Cliente:** Academia Diablos Rojos
**Dominio:** diablosrojoscl.com
**Email Soporte:** noreply@diablosrojoscl.com

---

## 🔄 Historial de Versiones

### v1.0.0 (Actual)
- ✅ Sistema completo de galerías
- ✅ Integración Flow Chile
- ✅ Emails transaccionales (Resend)
- ✅ Diseño minimalista Pixieset-inspired
- ✅ Optimización de imágenes (WebP/AVIF)
- ✅ Lazy loading con blur placeholders
- ✅ Page transitions suaves
- ✅ Responsive design completo

---

## 📚 Recursos Adicionales

- [Documentación Next.js 14](https://nextjs.org/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Flow API](https://www.flow.cl/docs/api.html)
- [Documentación Resend](https://resend.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Pixieset Design Reference](https://pixieset.com/)

---

**Última actualización:** 2025-12-11
**Estado:** ✅ Producción Estable

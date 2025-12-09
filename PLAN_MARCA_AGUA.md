# Plan de Implementación: Sistema de Marca de Agua Automático

## 📋 Resumen

Implementaremos un sistema que:
1. ✅ Genera marca de agua **automáticamente** al subir fotos
2. ✅ Guarda versión original (privada) + versión con marca de agua (pública)
3. ✅ Catálogo muestra solo fotos con marca de agua
4. ✅ Admin envía links de descarga cuando confirma pago por transferencia
5. ✅ Links temporales (7 días) para descargar fotos originales
6. ✅ **Preparado** para agregar pasarela de pago en el futuro

---

## 🎯 Fase 1: Implementación Inmediata (Antes de Producción)

### 1. Sistema de Marca de Agua

#### Marca de Agua Base
Vamos a crear una marca de agua simple pero efectiva:

**Opción A - Texto Simple (Rápido):**
- Texto: "DIABLOS ROJOS FOTO - www.diablosrojoscl.com"
- Posición: Diagonal centro o borde inferior
- Color: Blanco/Negro con semi-transparencia
- Fuente: Grande, clara

**Opción B - Logo + Texto (Recomendado):**
- Tu logo + texto
- Posición: Esquina inferior derecha
- Semi-transparente (50-60% opacidad)
- Si tienes logo PNG, lo usaremos

#### Estructura de Storage en Supabase

```
galleries/
  └── {gallery-id}/
      ├── original/          # PRIVADO - Solo admin
      │   ├── photo-1.jpg    # 5MB - alta resolución
      │   ├── photo-2.jpg
      │   └── ...
      │
      └── watermarked/       # PÚBLICO - Catálogo
          ├── photo-1.jpg    # 2MB - optimizado web + marca de agua
          ├── photo-2.jpg
          └── ...
```

#### Proceso de Upload

**Antes (actual):**
```
Admin sube foto → Va a Storage → Se muestra en catálogo
```

**Después (nuevo):**
```
Admin sube foto
  ↓
Sistema procesa en servidor
  ↓
Genera 2 versiones:
  1. Original (storage/original/) - PRIVADA
  2. Con marca de agua (storage/watermarked/) - PÚBLICA
  ↓
Catálogo muestra versión con marca de agua
```

---

### 2. Flujo de Entrega de Fotos

#### Proceso Completo

```
1. Cliente marca fotos favoritas en catálogo (con marca de agua)
   ↓
2. Cliente envía solicitud con sus datos + teléfono
   ↓
3. Admin recibe notificación
   ↓
4. Cliente hace transferencia (off-platform)
   ↓
5. Admin verifica pago recibido
   ↓
6. Admin en panel:
   - Marca solicitud como "Pagado"
   - Sistema automáticamente:
     * Genera links de descarga temporales (7 días)
     * Envía email al cliente con:
       - Links individuales por foto
       - O link a ZIP con todas las fotos
       - Instrucciones de descarga
     * Registra envío en BD
   ↓
7. Cliente recibe email y descarga fotos originales (sin marca de agua)
```

#### Email de Entrega

```
Asunto: 🎉 Tus fotos están listas para descargar

Hola {Nombre Cliente},

¡Excelente noticia! Tu pago ha sido confirmado y tus fotos ya están
disponibles para descargar en alta resolución sin marca de agua.

📸 Galería: {Nombre Galería}
🔢 Fotos: {Cantidad}
⏰ Disponible hasta: {Fecha expiración}

[Botón: Descargar Todas (ZIP)]

O descarga fotos individuales:
[Miniatura Foto 1] [Descargar]
[Miniatura Foto 2] [Descargar]
...

⚠️ IMPORTANTE:
- Los links expiran en 7 días
- Descarga las fotos pronto y guárdalas en tu dispositivo
- Si tienes problemas, responde a este email

¡Gracias por confiar en Diablos Rojos Foto!
```

---

### 3. Panel de Administración - Mejoras

#### Nueva columna en tabla de solicitudes:

| ... | Estado | Fotos Enviadas | Acciones |
|-----|--------|----------------|----------|
| ... | Pagado | ✅ 05/12/2025 | Ver fotos |
| ... | Pagado | ❌ No enviadas | **[Enviar Fotos]** |
| ... | Contactado | - | Ver fotos |

#### Nuevo botón: "Enviar Fotos"

Aparece cuando:
- Estado = "Pagado"
- Fotos aún no enviadas

Al hacer click:
1. Muestra confirmación: "¿Enviar fotos a {cliente}?"
2. Genera links de descarga
3. Envía email automáticamente
4. Marca como "Fotos enviadas" con fecha
5. Muestra toast de éxito

---

### 4. Preparación para Pasarela de Pago Futura

#### Cambios en Base de Datos

**Tabla `photo_requests` - Agregar campos:**

```sql
ALTER TABLE photo_requests ADD COLUMN payment_method VARCHAR(20) DEFAULT 'transfer';
-- 'transfer', 'online', 'cash'

ALTER TABLE photo_requests ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
-- 'pending', 'processing', 'completed', 'failed'

ALTER TABLE photo_requests ADD COLUMN payment_id VARCHAR(100);
-- Para guardar ID de transacción de pasarela

ALTER TABLE photo_requests ADD COLUMN amount DECIMAL(10,2);
-- Monto total pagado

ALTER TABLE photo_requests ADD COLUMN photos_sent_at TIMESTAMP;
-- Cuándo se enviaron las fotos

ALTER TABLE photo_requests ADD COLUMN download_links_expires_at TIMESTAMP;
-- Cuándo expiran los links
```

#### Estructura de Código Modular

```
lib/
  ├── payments/
  │   ├── transfer.ts      # Flujo actual (manual)
  │   ├── mercadopago.ts   # Para futuro (vacío por ahora)
  │   ├── flow.ts          # Para futuro (vacío por ahora)
  │   └── index.ts         # Interfaz común
  │
  └── delivery/
      ├── generateDownloadLinks.ts
      ├── sendPhotosEmail.ts
      └── index.ts
```

Esto permite agregar pasarela sin romper código existente.

---

## 📐 Especificaciones Técnicas

### Librería de Procesamiento de Imágenes

**Sharp** (la mejor para Node.js):
- Rápida (procesamiento en C++)
- Maneja JPEG, PNG, WebP
- Redimensionamiento inteligente
- Bajo uso de memoria

### Configuración de Marca de Agua

```javascript
// Configuración recomendada
{
  watermarkType: 'text', // 'text' o 'image'
  text: 'DIABLOS ROJOS FOTO',
  position: 'center-diagonal', // o 'bottom-right'
  opacity: 0.3, // 30% transparencia
  fontSize: 60,
  color: '#FFFFFF',
  rotation: -45, // diagonal

  // Para versión web optimizada
  outputQuality: 80, // JPEG quality
  maxWidth: 1920, // máximo ancho
  maxHeight: 1080
}
```

### Links de Descarga Temporales

Usaremos **Supabase Signed URLs**:
```javascript
const { data, error } = await supabase
  .storage
  .from('galleries')
  .createSignedUrl('original/photo.jpg', 604800); // 7 días en segundos

// Genera URL tipo:
// https://xxx.supabase.co/storage/v1/object/sign/galleries/original/photo.jpg?token=xxx
```

Ventajas:
- ✅ Gratis (incluido en Supabase)
- ✅ Seguro (token único por cliente)
- ✅ Expira automáticamente
- ✅ No requiere servidor adicional

---

## 💾 Estimación de Storage

### Por Galería (50 fotos):

| Tipo | Tamaño/foto | Total |
|------|-------------|-------|
| Original | 5MB | 250MB |
| Watermarked | 2MB | 100MB |
| **Total** | **7MB** | **350MB** |

### 20 Galerías:

- **Total storage**: ~7GB
- **Supabase Free**: 1GB (no alcanza)
- **Supabase Pro**: $25/mes = 100GB ✅

**Recomendación**: Empezar con **Supabase Pro** ($25/mes) antes de producción.

O considerar:
- Borrar galerías antiguas después de X meses
- Comprimir más las versiones watermarked
- Usar solo para galerías activas

---

## 🚀 Plan de Implementación (Días)

### Día 1: Setup Base
- [ ] Instalar Sharp
- [ ] Crear marca de agua base (texto)
- [ ] Modificar upload para generar 2 versiones
- [ ] Probar localmente

### Día 2: Integración Storage
- [ ] Actualizar estructura de carpetas en Supabase
- [ ] Configurar RLS policies
- [ ] Actualizar catálogo para usar watermarked
- [ ] Probar que admin ve ambas versiones

### Día 3: Sistema de Entrega
- [ ] Función para generar signed URLs
- [ ] Email template con links de descarga
- [ ] Botón "Enviar Fotos" en admin
- [ ] Agregar campos en BD (payment_method, photos_sent_at, etc.)

### Día 4: Testing & Polish
- [ ] Probar flujo completo
- [ ] Ajustar diseño de marca de agua
- [ ] Verificar expiración de links
- [ ] Documentación para ti

---

## ⚙️ Configuración Necesaria

### Variables de Entorno (.env.local)

```bash
# Existentes
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=xxx
ADMIN_EMAIL=xxx

# NUEVAS para marca de agua
WATERMARK_TEXT="DIABLOS ROJOS FOTO"
WATERMARK_OPACITY=0.3
WATERMARK_POSITION=center-diagonal
DOWNLOAD_LINK_EXPIRY_DAYS=7

# Para futuro (dejar vacío por ahora)
MERCADOPAGO_ACCESS_TOKEN=
FLOW_API_KEY=
```

---

## 🎨 Diseño de Marca de Agua

### Necesito de ti:

1. **¿Tienes logo en PNG?**
   - Si sí: envíamelo para usarlo en marca de agua
   - Si no: usaremos texto simple

2. **Preferencia de posición:**
   - A) Diagonal centro (más visible, mejor protección)
   - B) Esquina inferior derecha (menos intrusivo)
   - C) Repetido en patrón (máxima protección, más intrusivo)

3. **Nivel de protección:**
   - Sutil (30% opacidad) - cliente ve foto mejor, más fácil de remover
   - Moderado (50% opacidad) - balance
   - Fuerte (70% opacidad) - difícil de remover, pero foto se ve peor

**Recomendación para deportes escolares**: Moderado (50%) en diagonal centro.

---

## 📝 Próximos Pasos

1. **Tú decides**:
   - Diseño de marca de agua (envía logo o usamos texto)
   - Posición preferida
   - Nivel de opacidad

2. **Yo implemento**:
   - Todo el sistema (1-2 días)
   - Te muestro resultado
   - Ajustamos si es necesario

3. **Probamos juntos**:
   - Subes fotos de prueba
   - Verificamos marca de agua
   - Probamos flujo de entrega completo

4. **Salida a producción**:
   - Upgrade a Supabase Pro ($25/mes)
   - Deploy a producción
   - ¡Listo para tus primeros clientes!

---

## 💰 Costos Totales

| Concepto | Costo |
|----------|-------|
| Desarrollo | $0 (yo lo hago) |
| Supabase Pro | $25/mes |
| Resend (emails) | $0 (plan gratis suficiente) |
| **Total mensual** | **$25/mes** |

**Costo por galería**: $1.25 (si haces 20/mes)
**Costo por cliente**: $0.50 (si son 50 clientes/galería)

¡Súper razonable!

---

## 🔮 Evolución Futura (Cuando tengas presupuesto)

### Fase 2: Portal de Cliente Simple
- Login con email + código
- Re-descarga ilimitada
- Historial de compras
- **Tiempo**: +3 días | **Costo**: $0

### Fase 3: Pasarela de Pago Integrada
- MercadoPago o Flow integrado
- Pago online automático
- Descarga inmediata después de pagar
- **Tiempo**: +5 días | **Costo**: 2.9% comisión por transacción

---

## ❓ ¿Comenzamos?

Necesito de ti:
1. ✅ Confirmar que este plan te parece bien
2. 📸 Logo en PNG (si tienes) o usar texto simple
3. 🎨 Preferencia de diseño de marca de agua
4. 💳 Confirmar que puedes pagar Supabase Pro ($25/mes)

Una vez confirmes, empiezo la implementación. En 1-2 días tendrás el sistema funcionando y podrás salir a producción sin morir en el intento administrativo! 🚀

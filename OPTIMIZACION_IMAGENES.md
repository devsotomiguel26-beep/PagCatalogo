# 🖼️ Guía de Optimización de Imágenes

## 📊 Situación Actual

### Problema
Deshabilitamos la optimización de Next.js/Vercel porque excedíamos el límite gratuito de 1,000 optimizaciones/mes.

### Consecuencia
Las imágenes se sirven sin optimizar:
- Tamaño: ~2-3 MB por imagen (JPEG original)
- Formato: JPEG/PNG (no WebP/AVIF)
- Sin responsive: misma imagen para mobile y desktop
- Carga más lenta: ~3x más tiempo

---

## ✅ Solución Recomendada: Optimizar al Subir

En lugar de optimizar en cada request, optimizamos UNA VEZ al subir la imagen.

### Ventajas
- ✅ Sin límites de Vercel
- ✅ Imágenes ya optimizadas en Supabase
- ✅ Carga rápida (~ mismo speed que con optimización de Vercel)
- ✅ Sin costo adicional
- ✅ Menor uso de bandwidth de Supabase

---

## 🛠️ Implementación

### Paso 1: Instalar Sharp (librería de optimización)

```bash
npm install sharp
```

### Paso 2: Crear utilidad de optimización

Crea archivo `lib/imageOptimizer.ts`:

```typescript
import sharp from 'sharp';

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 85,
    format = 'webp'
  } = options;

  let pipeline = sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .rotate(); // Auto-rotate based on EXIF

  // Convertir a formato optimizado
  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality, compressionLevel: 9 });
  }

  return pipeline.toBuffer();
}

// Generar múltiples tamaños
export async function generateResponsiveSizes(
  buffer: Buffer
): Promise<{
  thumbnail: Buffer;    // 400px - para grids
  medium: Buffer;       // 1200px - para lightbox mobile
  large: Buffer;        // 2000px - para lightbox desktop
}> {
  const [thumbnail, medium, large] = await Promise.all([
    optimizeImage(buffer, { maxWidth: 400, maxHeight: 400, quality: 80 }),
    optimizeImage(buffer, { maxWidth: 1200, maxHeight: 1200, quality: 85 }),
    optimizeImage(buffer, { maxWidth: 2000, maxHeight: 2000, quality: 85 })
  ]);

  return { thumbnail, medium, large };
}
```

### Paso 3: Modificar el upload de imágenes

En tu API de upload (donde subes fotos a Supabase):

```typescript
import { optimizeImage } from '@/lib/imageOptimizer';

async function uploadPhoto(file: File) {
  // 1. Leer archivo
  const buffer = Buffer.from(await file.arrayBuffer());

  // 2. Optimizar
  const optimized = await optimizeImage(buffer);

  // 3. Subir a Supabase (ahora ~500KB en lugar de 2.5MB)
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(`${fileName}.webp`, optimized, {
      contentType: 'image/webp'
    });

  return data;
}
```

---

## 📈 Resultados Esperados

### Antes (sin optimización)
- Tamaño promedio: **2.5 MB**
- Formato: JPEG
- Tiempo de carga (4G): **~8 segundos**

### Después (con optimización al subir)
- Tamaño promedio: **~500 KB** (reducción 80%)
- Formato: WebP
- Tiempo de carga (4G): **~2 segundos** (4x más rápido)

### Comparación con optimización de Vercel
- Performance: **Igual o mejor**
- Costo: **$0** (vs eventual necesidad de Vercel Pro)
- Límites: **Sin límites**

---

## 🎯 Implementación Gradual

### Fase 1: Nuevas imágenes (INMEDIATO)
Implementar optimización para todas las imágenes nuevas que se suban.

### Fase 2: Imágenes existentes (OPCIONAL)
Script para optimizar las imágenes ya existentes:

```bash
node optimize-existing-photos.mjs
```

Script:
```javascript
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import https from 'https';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function optimizeExistingPhotos() {
  // 1. Obtener todas las fotos
  const { data: photos } = await supabase
    .from('photos')
    .select('*');

  for (const photo of photos) {
    console.log(`Optimizando ${photo.storage_path}...`);

    // 2. Descargar imagen original
    const imageBuffer = await downloadImage(photo.public_url);

    // 3. Optimizar
    const optimized = await sharp(imageBuffer)
      .resize(2000, 2000, { fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();

    // 4. Re-subir optimizada
    const newPath = photo.storage_path.replace(/\.(jpg|png)$/i, '.webp');
    await supabase.storage
      .from('photos')
      .upload(newPath, optimized, { upsert: true });

    // 5. Actualizar DB
    await supabase
      .from('photos')
      .update({
        storage_path: newPath,
        public_url: getPublicUrl(newPath)
      })
      .eq('id', photo.id);

    console.log(`✅ ${photo.storage_path} optimizada`);
  }
}
```

---

## 🔄 Alternativas

### Opción B: Supabase Image Transformation

Supabase tiene transformación built-in:

```jsx
<Image
  src={`${photo.public_url}?width=800&height=800&resize=contain&quality=80`}
  unoptimized={true}
/>
```

**Pros**: Sin setup, funciona ya
**Contras**: Genera transformaciones on-demand (puede ser lento la primera vez)

### Opción C: Cloudflare Images ($5-10/mes)

Para proyectos escalables:

```jsx
<Image
  src={`https://imagedelivery.net/${accountHash}/${imageId}/thumbnail`}
  unoptimized={true}
/>
```

**Pros**: Ilimitado, CDN global, muy rápido
**Contras**: Costo mensual, migración necesaria

### Opción D: Vercel Pro ($20/mes)

Si prefieres mantener todo en Vercel:

**Pros**: Sin cambios de código, 5,000 optimizaciones/mes
**Contras**: Costo mensil, límite puede no ser suficiente

---

## 💰 Comparación de Costos

| Solución | Costo Mensual | Límites | Performance | Complejidad |
|----------|---------------|---------|-------------|-------------|
| **Optimizar al subir** | **$0** | ∞ | ⭐⭐⭐⭐⭐ | Media |
| Supabase Transform | $0 | ∞ | ⭐⭐⭐⭐ | Baja |
| Vercel Pro | $20 | 5,000/mes | ⭐⭐⭐⭐⭐ | Baja |
| Cloudflare Images | $5-10 | ∞ | ⭐⭐⭐⭐⭐ | Media |
| Sin optimización (actual) | $0 | ∞ | ⭐⭐ | Ninguna |

---

## 🎯 Recomendación Final

### Para tu caso específico:

**Implementar "Optimizar al Subir"** porque:

1. ✅ **Gratis** - Sin costo adicional
2. ✅ **Sin límites** - No depende de Vercel
3. ✅ **Performance** - Igual o mejor que optimización de Vercel
4. ✅ **Escalable** - Funciona para miles de imágenes
5. ✅ **Control total** - Decides calidad, formato, tamaño

### Pasos siguientes:

1. Instalar sharp
2. Crear utilidad de optimización
3. Modificar API de upload
4. (Opcional) Optimizar imágenes existentes

---

## 📞 Dudas frecuentes

**P: ¿Puedo volver a habilitar la optimización de Vercel después?**
R: Sí, solo quita `unoptimized={true}`. Pero si optimizas al subir, no lo necesitarás.

**P: ¿Cuánto espacio ahorro en Supabase?**
R: ~80% (de 2.5MB a 500KB por imagen)

**P: ¿Afecta la calidad visual?**
R: No perceptible. WebP quality 85 es visualmente idéntico al JPEG original.

**P: ¿Qué pasa con las imágenes ya subidas?**
R: Funcionan igual. Opcionalmente puedes optimizarlas con el script.

**P: ¿Es mucho trabajo implementarlo?**
R: ~2-3 horas de desarrollo. Vale la pena por la mejora de performance.

---

**Última actualización**: 2026-01-19

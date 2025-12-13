# 📸 Implementación de Marcas de Agua - Instrucciones

## ✅ Qué se ha Hecho

1. ✅ Creado endpoint `/api/upload-photo` para procesar imágenes server-side
2. ✅ Modificado `PhotoUploadArea.tsx` para usar el nuevo endpoint
3. ✅ Creado script SQL para agregar campo `original_path`
4. ✅ Creado directorio `/public/watermark/` con README
5. ✅ Sharp ya está instalado (v0.33.1)

## 🚀 Pasos para Activar las Marcas de Agua

### Paso 1: Ejecutar Migración SQL en Supabase

1. Ve al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú izquierdo)
4. Abre el archivo `supabase-migration-watermark.sql` que se creó
5. Copia y pega el contenido en el editor
6. Haz click en **Run** (o presiona Cmd/Ctrl + Enter)
7. Verifica que veas el mensaje: "Success. No rows returned"

**Verificación:**
```sql
-- Ejecuta esto en SQL Editor para verificar:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'photos'
  AND column_name IN ('storage_path', 'original_path', 'public_url');
```

Deberías ver 3 filas: `storage_path`, `original_path`, `public_url`.

---

### Paso 2: Agregar Logo de Marca de Agua

**Necesitas el logo de Diablos Rojos en formato PNG con fondo transparente.**

#### Opción A: Si tienes el logo en PNG
1. Copia el archivo PNG del logo
2. Pégalo en: `/public/watermark/logo.png`
3. Verifica la ruta exacta: `PagCatalogo/public/watermark/logo.png`

#### Opción B: Si necesitas crear el logo
1. Abre tu logo en Photoshop/GIMP/Figma
2. Asegúrate de que el fondo sea transparente
3. Exporta como PNG con transparencia
4. Tamaño recomendado: 1500px - 2000px de ancho
5. Guárdalo como `logo.png` en `/public/watermark/`

**Verificación desde terminal:**
```bash
cd /Users/mgl26/Desarrollo/PagCatalogo
ls -lh public/watermark/logo.png

# Deberías ver algo como:
# -rw-r--r--  1 mgl26  staff   150K Dec 13 10:00 public/watermark/logo.png
```

---

### Paso 3: Crear Carpeta para Originales en Supabase Storage

1. Ve a **Storage** en Supabase
2. Abre el bucket `gallery-images`
3. Crea una carpeta llamada `galleries` (si no existe)
4. Dentro de `galleries`, las subcarpetas se crearán automáticamente

**Estructura esperada:**
```
gallery-images/
├── galleries/
│   ├── {gallery-id}/
│   │   ├── timestamp-abc123-catalog.jpg      ← Con watermark (público)
│   │   └── originals/
│   │       └── timestamp-abc123-original.jpg  ← Sin watermark (privado)
```

---

### Paso 4: Desplegar a Producción

```bash
# Asegúrate de estar en el directorio correcto
cd /Users/mgl26/Desarrollo/PagCatalogo

# Verificar que el logo existe
ls public/watermark/logo.png

# Commit de los cambios
git add .
git commit -m "Implementar sistema de marcas de agua

- Agregar endpoint /api/upload-photo para procesamiento server-side
- Modificar PhotoUploadArea para usar nuevo endpoint
- Agregar soporte para original_path en photos table
- Incluir logo de watermark"

# Deploy a Vercel
git push origin main

# O si usas Vercel CLI:
vercel --prod
```

---

### Paso 5: Probar el Sistema

#### Test 1: Subir foto nueva con marca de agua

1. Ve a: https://fotos.diablosrojoscl.com/admin/galerias
2. Selecciona o crea una galería de prueba
3. Sube una foto de prueba
4. Verifica en los logs del navegador (Console): `✅ Foto subida con marca de agua: {id}`
5. Verifica en Supabase Storage que existan:
   - `galleries/{id}/{timestamp}-catalog.jpg` (con watermark)
   - `galleries/{id}/originals/{timestamp}-original.jpg` (sin watermark)

#### Test 2: Verificar marca de agua visible

1. Ve a la galería pública: https://fotos.diablosrojoscl.com/galerias/{slug}
2. Haz click en la foto que subiste
3. Verifica que se vea el logo de Diablos Rojos en el centro con 50% de opacidad

#### Test 3: Verificar entrega de originales

1. Selecciona la foto con marca de agua
2. Completa el flujo de compra
3. Después del pago exitoso, revisa el email
4. Descarga la foto desde el link
5. Verifica que **NO tenga marca de agua** (es la original)

---

## 🔧 Configuración de Marca de Agua

Si quieres ajustar la apariencia de la marca de agua, edita `/lib/watermark.ts`:

```typescript
// Línea 121-125
const watermarkedBuffer = await addWatermark(resizedBuffer, {
  opacity: 50,        // 0-100 (50 = 50% transparente)
  position: 'center', // 'center' | 'bottom-right' | 'top-right'
  scale: 0.5,        // 0-1 (0.5 = 50% del ancho de la imagen)
});
```

**Opciones:**
- **opacity**: `30-70` (más bajo = más transparente)
- **position**:
  - `'center'` → Centrado en diagonal (recomendado)
  - `'bottom-right'` → Esquina inferior derecha
  - `'top-right'` → Esquina superior derecha
- **scale**: `0.3-0.7` (qué tan grande es el logo relativo a la imagen)

---

## 🐛 Troubleshooting

### Error: "Logo de marca de agua no encontrado"
**Causa:** No existe el archivo `/public/watermark/logo.png`
**Solución:**
```bash
# Verifica que existe:
ls -la public/watermark/logo.png

# Si no existe, coloca el logo PNG ahí
```

### Error: "column 'original_path' does not exist"
**Causa:** No ejecutaste la migración SQL
**Solución:** Ve al Paso 1 y ejecuta `supabase-migration-watermark.sql`

### Error: "Watermark too small/large"
**Causa:** Logo muy pequeño o muy grande
**Solución:**
- Asegúrate de que el logo sea mínimo 1000px de ancho
- Ajusta el parámetro `scale` en `/lib/watermark.ts`

### Las fotos tardan mucho en subir
**Causa:** Procesamiento server-side toma tiempo
**Normal:** 5-15 segundos por foto (depende del tamaño original)
**Optimización:** Pedir a usuarios que suban fotos ya redimensionadas (máx 4000px)

### La marca de agua se ve muy opaca/transparente
**Solución:** Ajusta `opacity` en `/lib/watermark.ts` (línea 122):
- Muy opaca → Reduce a `30-40`
- Muy transparente → Aumenta a `60-70`

---

## 📊 Monitoreo en Producción

### Ver logs de procesamiento:
```bash
# En Vercel Dashboard:
# 1. Ve a tu proyecto
# 2. Click en "Logs"
# 3. Busca "📸 Procesando imagen" para ver cada upload

# Deberías ver:
# 📸 Procesando imagen: foto.jpg (3.5 MB)
# 🔧 Procesando versión original...
# 💧 Aplicando marca de agua...
# ⬆️  Subiendo versión original...
# ⬆️  Subiendo versión catálogo...
# 💾 Guardando en base de datos...
# ✅ Foto procesada exitosamente: {uuid}
```

### Verificar en Supabase:
```sql
-- Ver fotos con y sin original_path
SELECT
  id,
  gallery_id,
  storage_path,
  original_path,
  created_at
FROM photos
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📝 Checklist Final

Antes de considerar completa la implementación:

- [ ] Migración SQL ejecutada en Supabase
- [ ] Campo `original_path` existe en tabla `photos`
- [ ] Logo PNG existe en `/public/watermark/logo.png`
- [ ] Logo tiene fondo transparente
- [ ] Logo tiene buen tamaño (1000px+ de ancho)
- [ ] Código desplegado a Vercel
- [ ] Subiste foto de prueba
- [ ] Marca de agua visible en galería pública
- [ ] Original sin marca enviada post-compra
- [ ] Logs muestran procesamiento exitoso

---

## 🎯 Resultado Esperado

### Galería Pública (con watermark):
```
Usuario navega → Ve foto con logo Diablos Rojos al 50% opacidad centrado
```

### Post-Compra (sin watermark):
```
Usuario paga → Recibe email → Descarga foto original sin marca de agua
```

### Almacenamiento:
```
Supabase Storage:
├── galleries/{gallery-id}/
│   ├── {timestamp}-catalog.jpg       ← Mostrada en web (CON watermark)
│   └── originals/
│       └── {timestamp}-original.jpg  ← Enviada por email (SIN watermark)
```

---

**¿Necesitas ayuda?** Si encuentras algún error durante la implementación, comparte:
1. El mensaje de error completo
2. Los logs de Vercel (si aplica)
3. Screenshot del problema

¡Buena suerte! 🚀

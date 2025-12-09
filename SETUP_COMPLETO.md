# 🚀 Setup Completo - Sistema de Marca de Agua

Este documento contiene TODOS los pasos necesarios para poner en funcionamiento el sistema de marca de agua. Sigue los pasos en orden.

---

## 📋 Paso 1: Instalar Sharp

```bash
npm install sharp --legacy-peer-deps
```

Si tienes problemas, intenta:
```bash
npm install sharp --force
```

---

## 📋 Paso 2: Actualizar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Variables existentes (ya las tienes)
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
RESEND_API_KEY=tu-resend-api-key
RESEND_FROM_EMAIL=tu-email
ADMIN_EMAIL=tu-admin-email

# NUEVA - Service Role Key (para el API de upload)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### ¿Dónde encontrar la Service Role Key?

1. Ve a tu proyecto en Supabase Dashboard
2. Settings → API
3. Busca "Project API keys"
4. Copia la **service_role** key (¡NO la compartas públicamente!)

---

## 📋 Paso 3: Actualizar Base de Datos

1. Ve a Supabase Dashboard → SQL Editor
2. Crea una nueva query
3. Copia y pega TODO el contenido del archivo `WATERMARK_DB_UPDATE.sql`
4. Ejecuta (Run)
5. Verifica que no haya errores

Esto agregará:
- Campo `original_path` a la tabla `photos`
- Campos de gestión de pagos a `photo_requests`
- Índices para mejorar rendimiento

---

## 📋 Paso 4: Configurar Permisos de Storage en Supabase

### Crear bucket (si no existe)

1. Ve a Supabase Dashboard → Storage
2. Si no tienes el bucket `gallery-images`, créalo:
   - Click "New bucket"
   - Name: `gallery-images`
   - Public: ✅ Yes (para las fotos con marca de agua)

### Configurar Policies (Políticas de acceso)

#### Opción A: Sin RLS (Más simple, para empezar)

1. Ve a Storage → gallery-images → Policies
2. Deshabilita RLS temporalmente para pruebas
3. **IMPORTANTE**: En producción deberás habilitar RLS con políticas específicas

#### Opción B: Con RLS (Recomendado para producción)

Crea estas políticas en Storage → gallery-images → Policies:

**Política 1: Admin puede subir y ver todo**
- Name: `Admin full access`
- Target: All operations
- Policy definition:
```sql
auth.role() = 'authenticated'
```

**Política 2: Público puede ver carpeta watermarked**
- Name: `Public can view watermarked`
- Target: SELECT
- Policy definition:
```sql
bucket_id = 'gallery-images' AND
(storage.foldername(name))[1] = 'watermarked'
```

**Política 3: Solo admin puede ver carpeta original**
- Name: `Admin only original`
- Target: SELECT
- Policy definition:
```sql
bucket_id = 'gallery-images' AND
(storage.foldername(name))[1] = 'original' AND
auth.role() = 'authenticated'
```

---

## 📋 Paso 5: Verificar que el Logo esté en su lugar

Debe existir el archivo:
```
/public/watermark/logo.png
```

✅ Ya lo creamos automáticamente cuando copiamos tu logo.

---

## 📋 Paso 6: Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

---

## 🧪 Paso 7: Probar el Sistema

### Prueba 1: Subir foto con marca de agua

1. Inicia sesión en `/admin/login`
2. Ve a una galería existente o crea una nueva
3. Sube una foto de prueba
4. Espera a que termine el upload
5. Ve a la galería en el catálogo público
6. **Verifica que la foto tiene tu logo como marca de agua**

### Prueba 2: Verificar archivos en Storage

1. Ve a Supabase Dashboard → Storage → gallery-images
2. Navega a la carpeta de tu galería
3. Deberías ver 2 carpetas:
   - `original/` - Fotos sin marca de agua
   - `watermarked/` - Fotos con marca de agua

### Prueba 3: Verificar en Base de Datos

1. Ve a Supabase Dashboard → Table Editor → photos
2. Busca la foto que acabas de subir
3. Verifica que tenga:
   - `storage_path` apuntando a `/watermarked/...`
   - `original_path` apuntando a `/original/...`

---

## ⚠️ Troubleshooting (Solución de Problemas)

### Error: "Cannot find module 'sharp'"

```bash
npm install sharp --legacy-peer-deps
```

### Error: "Logo de marca de agua no encontrado"

Verifica que existe:
```bash
ls -la public/watermark/logo.png
```

Si no existe:
```bash
mkdir -p public/watermark
cp diablosRojos.png public/watermark/logo.png
```

### Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"

Asegúrate de:
1. Agregar la variable en `.env.local`
2. Reiniciar el servidor (`npm run dev`)

### Las fotos NO tienen marca de agua

Esto puede pasar si:
1. Sharp no está instalado correctamente
2. El API route tiene errores

Verifica los logs en la consola del navegador (F12 → Console)

### Error al subir fotos: "Failed to upload"

1. Verifica permisos de Storage en Supabase
2. Verifica que la Service Role Key sea correcta
3. Revisa los logs del servidor

---

## 📊 Verificación Final

✅ Marca cada item cuando lo completes:

- [ ] Sharp instalado (`npm list sharp` muestra la versión)
- [ ] Variables de entorno agregadas (incluida SERVICE_ROLE_KEY)
- [ ] Script SQL ejecutado en Supabase
- [ ] Bucket `gallery-images` existe
- [ ] Policies de storage configuradas
- [ ] Logo en `/public/watermark/logo.png`
- [ ] Servidor reiniciado
- [ ] Foto de prueba subida con marca de agua
- [ ] Carpetas `original/` y `watermarked/` creadas en Storage
- [ ] Campo `original_path` en base de datos

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu sistema de marca de agua está funcionando.

**Próximos pasos** (pendientes):
1. API route para enviar fotos por email (en desarrollo)
2. Botón "Enviar Fotos" en admin panel (en desarrollo)
3. Testing del flujo completo

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs de consola (F12 → Console)
2. Revisa los logs del servidor terminal donde corre `npm run dev`)
3. Verifica cada paso de este documento
4. Contáctame con el error específico que ves

¡Éxito! 🚀

# Proyecto: Diablos Rojos Foto – MVP Galerías Deportivas

Este documento describe **todo** lo necesario para que una IA de desarrollo (Claude Code) implemente el **MVP completo** de una plataforma de galerías fotográficas deportivas.

El objetivo es que a partir de este documento se pueda construir el proyecto **sin ambigüedades**.

---

## 1. Resumen del producto

Plataforma web para mostrar y gestionar galerías de **fotos deportivas de fútbol infantil**, utilizada por un único fotógrafo (admin) para:

- Crear galerías (partidos, torneos, eventos).
- Subir fotos exportadas desde Lightroom (ya con marca de agua, tamaño web).
- Publicar estas galerías en un sitio moderno y atractivo.
- Permitir que los clientes (apoderados/jugadores) vean las fotos y marquen **favoritas**.

**Importante:**  
Este MVP **no incluye pagos ni descargas de alta resolución**.  
Es solo catálogo visual + gestión interna de galerías.

---

## 2. Stack técnico (obligatorio)

Implementar usando este stack:

- **Frontend / Backend**:  
  - [Next.js](https://nextjs.org/) (App Router, última versión estable)  
  - Lenguaje: **TypeScript**
- **Styling / UI**:
  - **Tailwind CSS** para estilos.
  - Componentes propios o mínimos, sin depender de design systems pesados.
- **Estado / lógica cliente**:
  - React (Next) hooks.
- **Base de datos y Auth**:
  - **Supabase** (PostgreSQL gestionado + Auth).
- **Almacenamiento de imágenes**:
  - **Supabase Storage** (bucket dedicado a las imágenes web).
- **Despliegue**:
  - Preferentemente **Vercel** para la app Next.js.

El proyecto debe estar preparado para:

- Entorno local (desarrollo).
- Despliegue en Vercel con variables de entorno para Supabase.

---

## 3. Roles de usuario

Para el MVP solo existen dos tipos de usuario:

1. **Fotógrafo / Admin**
   - Único usuario que accede al panel `/admin`.
   - Crea/edita galerías.
   - Sube fotos.
   - Publica o despublica galerías.

2. **Cliente / Visitante**
   - No requiere login.
   - Navega por:
     - Home (`/`)
     - Listado de galerías (`/galerias`)
     - Galería específica (`/galerias/[slug]`)
   - Puede:
     - Ver fotos.
     - Abrirlas en un lightbox.
     - Marcar favoritas (guardadas localmente en el navegador con `localStorage`).

---

## 4. Requisitos funcionales

### 4.1. Parte pública (visitante)

1. **Home (`/`)**
   - Mostrar:
     - Nombre del proyecto (“Diablos Rojos Fotografía Deportiva” o similar).
     - Imagen hero (puede ser una imagen estática de ejemplo inicialmente).
     - Texto corto explicando que se pueden ver fotos de partidos y torneos.
     - Botón principal “Ver galerías” que lleva a `/galerias`.
   - Debe ser completamente responsive y visualmente atractivo.

2. **Listado de galerías (`/galerias`)**
   - Mostrar todas las galerías en estado **publicado** ordenadas por fecha (más recientes primero).
   - Cada galería se muestra como **tarjeta** con:
     - Foto de portada (puede ser la primera foto de la galería).
     - Título (nombre del evento/partido).
     - Categoría (Sub-8, Sub-10, Sub-11, etc.).
     - Tipo de evento (Partido, Torneo, Evento especial, etc.).
     - Fecha.
   - Debe haber filtros básicos:
     - Filtro por categoría (dropdown).
     - Filtro por tipo de evento (dropdown).
   - Al hacer click en una tarjeta → navegar a `/galerias/[slug]`.

3. **Página de galería (`/galerias/[slug]`)**
   - Mostrar:
     - Título de la galería.
     - Categoría.
     - Tipo de evento.
     - Nombre de torneo/evento (opcional).
     - Fecha.
     - Lugar (opcional).
   - Mostrar un **grid de fotos** (todas las asociadas a esa galería).
   - Cada foto:
     - Se ve como miniatura.
     - Al hacer click → se abre en un **lightbox**.
   - Debe haber un indicador de favoritas:
     - Un contador del tipo: “Has marcado X fotos como favoritas” (estado local).
   - Las fotos deben mostrarse con dimensiones correctas y un layout agradable (puede ser grid responsivo estándar).

4. **Lightbox**
   - Al hacer click en una foto:
     - Abrir overlay de pantalla:
       - Foto en grande.
       - Fondo oscuro.
       - Botón/cross para cerrar.
       - Flechas o controles para navegar a foto anterior/siguiente.
       - Botón/icono de “Favorito” (corazón/estrella) visible.
   - **Favorito**:
     - Si el usuario marca una foto como favorita:
       - Cambiar estado visual (icono lleno/vacío).
       - Guardar la info en `localStorage` con una clave por galería (por ejemplo: `favorites_<galleryId>`).
     - Si recarga la página, los favoritos deben mantenerse (leer `localStorage`).
   - No hay backend para favoritos en el MVP (solo cliente).

---

### 4.2. Parte privada (admin)

1. **Login admin (`/admin/login` o `/admin`)**
   - Autenticación gestionada por Supabase Auth.
   - No es necesario flujo de registro desde la UI:
     - El admin se creará manualmente en Supabase.
   - Al loguearse correctamente:
     - Redirigir a `/admin/dashboard`.

2. **Dashboard admin (`/admin/dashboard`)**
   - Mostrar:
     - Botón “Crear nueva galería”.
     - Tabla o listado de últimas galerías creadas.
   - Elementos mínimos:
     - Nombre de la galería.
     - Categoría.
     - Fecha.
     - Estado (borrador/publicado).
     - Link rápido para editar.

3. **Listado de galerías admin (`/admin/galerias`)**
   - Tabla con todas las galerías (paginación simple si hace falta).
   - Columnas:
     - Título.
     - Categoría.
     - Tipo de evento.
     - Fecha.
     - Estado (borrador/publicado).
     - Nº de fotos.
     - Acciones: Editar, Ver pública (link).

4. **Crear nueva galería (`/admin/galerias/nueva`)**
   - Formulario con campos:
     - Título (string).
     - Slug (puede generarse automáticamente a partir del título, editable).
     - Categoría (select desde tabla `categorias`).
     - Tipo de evento (select: Partido, Torneo, Evento especial, Entrenamiento, etc.).
     - Torneo/evento (string opcional).
     - Fecha (date).
     - Lugar (string opcional).
     - Estado inicial: **borrador**.
   - Botón “Guardar”:
     - Crea registro en DB.
     - Redirige a pantalla de edición/subida de fotos para esa galería.

5. **Editar galería (`/admin/galerias/[id]`)**
   - Mostrar el mismo formulario que en “nueva”, pero relleno con los datos actuales.
   - Permitir:
     - Cambiar cualquier campo.
     - Cambiar estado a “publicado” o “borrador”.
   - Incluir sección para fotos:
     - Ver lista de fotos actuales (miniaturas).
     - Eliminar foto individualmente.

6. **Subida de fotos a galería (`/admin/galerias/[id]/fotos` o integrado en la página de edición)**
   - Zona de subida con:
     - “Arrastrar y soltar” o botón “Seleccionar archivos”.
     - Soportar subida múltiple.
   - Al seleccionar archivos:
     - Subirlos al bucket de Supabase Storage.
     - Crear registro en tabla `fotos` por cada imagen subida.
   - Mostrar miniaturas de las fotos subidas.
   - Debe haber un botón para eliminar fotos (borrar de DB y del Storage).
   - No se requieren transformaciones de imágenes en el servidor:
     - Se asume que las imágenes ya vienen optimizadas y con marca de agua desde Lightroom.

7. **Cambiar estado de publicación**
   - Desde la edición de la galería se debe poder:
     - Publicar (visible en parte pública).
     - Despublicar (no visible para visitas).

---

## 5. Esquema de base de datos (Supabase / PostgreSQL)

Implementar las siguientes tablas en Supabase (con migraciones o SQL adecuado).

### 5.1. Tabla `categories` (categorías de fútbol)

- `id` (uuid o serial, pk).
- `name` (text) – ejemplo: "Sub-8", "Sub-10", etc.
- `slug` (text, único) – ej: "sub-8".
- `created_at` (timestamp, default now()).

Datos iniciales sugeridos (seed):

- Sub-6
- Sub-8
- Sub-10
- Sub-11
- Sub-13
- Femenino (opcional)

### 5.2. Tabla `galleries`

- `id` (uuid o serial, pk).
- `title` (text, not null).
- `slug` (text, unique, not null).
- `category_id` (fk → categories.id, not null).
- `event_type` (text, not null)  
  Ej: "partido", "torneo", "evento", "entrenamiento".
- `tournament` (text, null) – nombre del torneo/evento si aplica.
- `event_date` (date, not null).
- `location` (text, null).
- `status` (text, not null) – valores esperados: `"draft"` o `"published"`.
- `cover_photo_id` (fk → photos.id, null) – se puede usar más adelante, inicialmente puede quedarse null.
- `created_at` (timestamp, default now()).
- `updated_at` (timestamp, default now()).

### 5.3. Tabla `photos`

- `id` (uuid o serial, pk).
- `gallery_id` (fk → galleries.id, not null, on delete cascade).
- `storage_path` (text, not null) – ruta en Supabase Storage (ej: `galerias/<gallery_id>/<filename>.jpg`).
- `public_url` (text, not null) – URL pública generada por Supabase.
- `position` (integer, null) – para orden de visualización (menor → primero).
- `created_at` (timestamp, default now()).

### 5.4. Tabla `users` (opcional, si no se usa directamente la de Supabase Auth)

- Se puede usar la tabla de auth de Supabase directamente, así que no es estrictamente necesario crear tabla `users` propia para el MVP.
- El admin se gestiona desde Supabase Auth (email/password).

---

## 6. Almacenamiento de imágenes (Supabase Storage)

Configurar un bucket en Supabase:

- Nombre sugerido: `gallery-images`.
- Acceso:
  - Público de lectura para las imágenes web.
  - Escritura restringida al admin autenticado.
- Estructura de paths dentro del bucket:
  - `/galleries/<gallery_id>/<filename>.jpg`

Cuando se sube una foto desde el panel admin:

1. Subir archivo al bucket en la ruta anterior.
2. Obtener URL pública o método para generar URL accesible.
3. Guardar `storage_path` y `public_url` en la tabla `photos`.

---

## 7. Rutas y estructura del proyecto (Next.js App Router)

Usar la estructura de **App Router** (`app/`).

### 7.1. Rutas públicas

- `/`
  - `app/page.tsx`
- `/galerias`
  - `app/galerias/page.tsx`
- `/galerias/[slug]`
  - `app/galerias/[slug]/page.tsx`

### 7.2. Rutas admin

- `/admin/login` (podría ser `/admin` si se combina)
  - `app/admin/login/page.tsx`
- `/admin/dashboard`
  - `app/admin/dashboard/page.tsx`
- `/admin/galerias`
  - `app/admin/galerias/page.tsx`
- `/admin/galerias/nueva`
  - `app/admin/galerias/nueva/page.tsx`
- `/admin/galerias/[id]`
  - `app/admin/galerias/[id]/page.tsx`

Se pueden usar layouts (`app/admin/layout.tsx`) para compartir navegación admin.

---

## 8. Componentes principales a implementar

Implementar componentes reutilizables en `components/` (o similar). Ejemplos:

1. **Header / Navbar**
   - Logo/nombre.
   - Link a “Galerías”.
   - No mostrar accesos al admin en la nav pública (o si se muestra, hacerlo discreto).

2. **Footer**
   - Texto de copyright.
   - Links a redes sociales (placeholders).

3. **GalleryCard**
   - Recibe datos de una galería.
   - Muestra portada, título, categoría, fecha, etc.

4. **GalleryGrid**
   - Layout responsivo de tarjetas de galería.

5. **PhotoGrid**
   - Layout responsivo de fotos de una galería.

6. **Lightbox**
   - Controla:
     - Foto actual.
     - Controles de navegación.
     - Favorito.

7. **FavoriteButton**
   - Recibe estado `isFavorite` y callback.
   - Muestra icono correspondiente.

8. **AdminLayout**
   - Layout base para todas las páginas admin (sidebar o topbar).

9. **GalleryForm**
   - Usado para crear/editar galerías:
     - Campos de texto.
     - Dropdowns.
     - Datepicker simple.

10. **PhotoUploadArea**
    - Área drag & drop.
    - Lista de archivos seleccionados.
    - Botón para iniciar subida.

---

## 9. Lógica de favoritos (detallada)

- Favoritos **solo existe en el cliente** (no en DB).
- Key de `localStorage` sugerida:
  - `favorites_<galleryId>`
- Formato guardado en localStorage:
  - Puede ser un array de `photoId` o un objeto `{ [photoId]: true }`.
- Flujo:
  1. Al cargar la página de galería:
     - Leer `localStorage` para esa galería.
     - Inicializar estado de favoritos en React.
  2. Al hacer click en “favorito”:
     - Togglear el estado en React.
     - Volcar el nuevo estado a `localStorage`.
  3. El contador de favoritas se basa en la longitud del listado en estado.

---

## 10. Requisitos de diseño y UX

- Diseño moderno, limpio, con énfasis en las fotos.
- Uso de Tailwind para:
  - Layout responsivo (mobile first).
  - Espaciados generosos.
  - Tipografía legible.
- Animaciones suaves:
  - Hover en tarjetas de galerías.
  - Aparición del lightbox.
- Mostrar “loading states” donde aplique:
  - Al cargar galerías.
  - Al cargar fotos.

---

## 11. Seguridad y acceso admin

- El panel `/admin` y sus subrutas deben protegerse:
  - Si el usuario no está autenticado (Supabase Auth), redirigir a `/admin/login`.
- Manejar logout:
  - Botón “Cerrar sesión” en admin layout.
- No es necesario implementar roles ni permisos complejos en el MVP:
  - Basta con un solo usuario admin.

---

## 12. Variables de entorno y configuración

El proyecto debe usar variables de entorno para:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Cualquier otra clave necesaria.

Configurar un cliente de Supabase reutilizable (por ejemplo en `lib/supabaseClient.ts`) para:

- Operaciones del lado cliente donde haga falta.
- Operaciones del lado servidor (Server Components / Server Actions).

---

## 13. Testing y validación mínima

No es necesario implementar una suite de tests grande, pero se espera:

- Validar que:
  - Se puede crear una galería desde admin.
  - Se puede subir varias fotos.
  - La galería aparece en `/galerias`.
  - Las fotos aparecen en `/galerias/[slug]`.
  - El lightbox funciona.
  - Los favoritos se guardan y se recuerdan al recargar la página.

---

## 14. Criterio de “MVP completo”

Se considera que el MVP está **completamente implementado** cuando:

1. El proyecto puede ejecutarse localmente con:
   - `pnpm dev` o `npm run dev` (según se elija).
2. Se puede desplegar en Vercel con las variables de entorno.
3. `diablosrojoscl.com` muestra:
   - Home.
   - Listado de galerías.
   - Galería individual.
4. Desde el panel admin:
   - Se puede iniciar sesión.
   - Crear una nueva galería.
   - Subir fotos.
   - Publicar la galería.
5. En la parte pública:
   - La galería aparece en el listado.
   - Las fotos se muestran correctamente.
   - El lightbox y favoritos funcionan usando `localStorage`.

---

## 15. Instrucciones para la IA de desarrollo (Claude Code)

- Respetar este documento como **fuente de verdad** para el MVP.
- Implementar usando **TypeScript**, Next.js App Router y Tailwind.
- Crear estructura de carpetas clara:
  - `app/` para rutas.
  - `components/` para componentes UI.
  - `lib/` para utilidades (ej: cliente Supabase).
- Mantener el código modular y legible.
- No agregar funcionalidades fuera de este MVP sin que lo pida explícitamente el usuario.
- Donde haya ambigüedad menor (ej: exacto diseño del header), elegir una solución coherente y limpia.

Fin del documento.


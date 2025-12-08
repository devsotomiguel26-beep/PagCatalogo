# Diablos Rojos Fotografía Deportiva

Plataforma web para mostrar y gestionar galerías de fotos deportivas de fútbol infantil.

## Stack Tecnológico

- **Frontend/Backend**: Next.js 14 (App Router) con TypeScript
- **Styling**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage
- **Despliegue**: Vercel

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 2. Configurar Supabase

#### 2.1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la URL y la `anon` key de tu proyecto (Settings → API)

#### 2.2. Crear las tablas de la base de datos

Ve a SQL Editor en Supabase y ejecuta el siguiente script:

```sql
-- Crear tabla de categorías
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de galerías
CREATE TABLE galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  event_type TEXT NOT NULL,
  tournament TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_photo_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de fotos
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías iniciales
INSERT INTO categories (name, slug) VALUES
  ('Sub-6', 'sub-6'),
  ('Sub-8', 'sub-8'),
  ('Sub-10', 'sub-10'),
  ('Sub-11', 'sub-11'),
  ('Sub-13', 'sub-13'),
  ('Femenino', 'femenino');
```

#### 2.3. Crear bucket de Storage

1. Ve a Storage en el panel de Supabase
2. Crea un nuevo bucket llamado `gallery-images`
3. Configura el bucket como **público** (Public bucket)
4. En las políticas (Policies), crea las siguientes:

**Política de lectura pública:**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery-images' );
```

**Política de subida para usuarios autenticados:**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'gallery-images' AND auth.role() = 'authenticated' );
```

**Política de eliminación para usuarios autenticados:**
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'gallery-images' AND auth.role() = 'authenticated' );
```

#### 2.4. Crear usuario administrador

1. Ve a Authentication → Users en Supabase
2. Click en "Add User" → "Create new user"
3. Ingresa:
   - Email: `admin@ejemplo.com` (o el que prefieras)
   - Password: Una contraseña segura
   - ✅ Auto Confirm User (marcar esta opción)
4. Click en "Create user"

### 3. Configurar variables de entorno

1. Copiar `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Editar `.env.local` y completar con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

### 5. Abrir en el navegador

- **Sitio público**: http://localhost:3000
- **Panel admin**: http://localhost:3000/admin/login

Usa las credenciales del usuario administrador que creaste en el paso 2.4.

## Estructura del Proyecto

```
/
├── app/                                    # Rutas Next.js (App Router)
│   ├── layout.tsx                         # Layout raíz
│   ├── page.tsx                           # Home pública
│   ├── galerias/
│   │   ├── page.tsx                       # Listado de galerías
│   │   └── [slug]/page.tsx                # Galería individual
│   └── admin/                             # Panel de administración
│       ├── layout.tsx                     # Layout admin con auth
│       ├── login/page.tsx                 # Login admin
│       ├── dashboard/page.tsx             # Dashboard
│       └── galerias/
│           ├── page.tsx                   # Listado admin
│           ├── nueva/page.tsx             # Crear galería
│           └── [id]/page.tsx              # Editar galería
├── components/                            # Componentes reutilizables
│   ├── Header.tsx                         # Navbar pública
│   ├── Footer.tsx                         # Footer
│   ├── GalleryCard.tsx                    # Tarjeta de galería
│   ├── GalleryGrid.tsx                    # Grid de galerías
│   ├── PhotoGrid.tsx                      # Grid de fotos
│   ├── Lightbox.tsx                       # Modal de fotos
│   ├── FavoriteButton.tsx                 # Botón de favoritos
│   ├── forms/
│   │   └── GalleryForm.tsx                # Formulario de galería
│   └── upload/
│       └── PhotoUploadArea.tsx            # Subida de fotos
├── lib/
│   └── supabaseClient.ts                  # Cliente de Supabase
├── styles/
│   └── globals.css                        # Estilos globales
├── MVP_SPEC.md                            # Especificación del MVP
├── DEV_PLAN.md                            # Plan de desarrollo
└── README.md                              # Este archivo
```

## Desarrollo

Este proyecto sigue las especificaciones definidas en:
- `MVP_SPEC.md` - Especificaciones funcionales del MVP
- `DEV_PLAN.md` - Plan de desarrollo técnico

### Fases de Desarrollo

- ✅ **FASE 1**: Scaffold inicial del proyecto
- ✅ **FASE 2**: Parte pública (galerías y fotos)
- ✅ **FASE 3**: Panel admin
- ✅ **FASE 4**: Subida de fotos
- ✅ **FASE 5**: UX y validaciones

## Comandos Disponibles

```bash
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Construir para producción
npm run start    # Ejecutar build de producción
npm run lint     # Ejecutar linter
```

## Licencia

Privado - Todos los derechos reservados

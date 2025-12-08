📄 DEV_PLAN.md — Plan de Desarrollo para Claude Code

Este archivo define exactamente cómo Claude Code debe ejecutar el desarrollo técnico del MVP, siguiendo las especificaciones funcionales descritas en MVP_SPEC.md.

El objetivo es permitir que la IA construya el proyecto de forma estructurada, ordenada, consistente y sin ambigüedades.

🔷 1. Reglas generales para Claude Code

Leer completamente MVP_SPEC.md antes de escribir código.
Debes cumplirlo al 100%. Ese archivo es la fuente de verdad funcional.

Nunca modificar MVP_SPEC.md, a menos que el usuario lo solicite explícitamente.

Cada iteración de desarrollo debe respetar este orden y estos criterios.
Claude Code no debe saltarse pasos.

Al modificar archivos existentes, debes mostrar un diff claro y el archivo completo actualizado.

No crear funcionalidades que no estén en el MVP, aunque parezcan útiles o fáciles.

Todo el proyecto debe implementarse usando:

Next.js (App Router)

TypeScript

TailwindCSS

Supabase (DB + Auth + Storage)

Componentes React bien modularizados

Cualquier ambigüedad técnica debe resolverse siguiendo estas prioridades:

MVP_SPEC.md

Buenas prácticas de Next.js / React / Tailwind

Mantener simplicidad sobre optimización prematura

El proyecto debe ser funcional en local (npm run dev) y en Vercel.

🔷 2. Estructura general de archivos que Claude debe construir

Al iniciar el proyecto, Claude Code debe crear automáticamente:

/
├─ app/
│  ├─ (públicas)
│  │  ├─ page.tsx                     → Home
│  │  ├─ galerias/
│  │  │   ├─ page.tsx                 → Listado de galerías
│  │  │   └─ [slug]/page.tsx          → Galería individual
│  ├─ (admin)
│  │  ├─ admin/
│  │  │   ├─ login/page.tsx           → Login admin
│  │  │   ├─ dashboard/page.tsx       → Dashboard
│  │  │   ├─ galerias/page.tsx        → Listado galerías admin
│  │  │   ├─ galerias/nueva/page.tsx  → Crear nueva galería
│  │  │   └─ galerias/[id]/page.tsx   → Editar galería
│  │  │
│  │  │─ admin/layout.tsx             → Layout con navbar admin
│
├─ components/
│  ├─ Header.tsx
│  ├─ Footer.tsx
│  ├─ GalleryCard.tsx
│  ├─ GalleryGrid.tsx
│  ├─ PhotoGrid.tsx
│  ├─ Lightbox.tsx
│  ├─ FavoriteButton.tsx
│  ├─ forms/GalleryForm.tsx
│  ├─ upload/PhotoUploadArea.tsx
│
├─ lib/
│  ├─ supabaseClient.ts               → Cliente de Supabase
│
├─ styles/
│  ├─ globals.css
│
├─ .env.local.example
├─ MVP_SPEC.md
├─ DEV_PLAN.md
└─ package.json


Claude Code debe crear y poblar esta estructura sin cambios arbitrarios.

🔷 3. Orden de desarrollo que Claude Code debe seguir

Este es el orden obligado.
Claude debe completar cada etapa antes de avanzar a la siguiente, salvo solicitud explícita del usuario.

🧩 FASE 1 — Scaffold inicial del proyecto

Claude debe:

Crear un proyecto Next.js con TypeScript, App Router, sin ejemplos.

Instalar y configurar Tailwind CSS.

Crear archivo lib/supabaseClient.ts.

Configurar variables de entorno:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Crear el layout general:

Header

Footer

Crear la Home (/) con placeholder.

Objetivo al finalizar:
Proyecto corre localmente (npm run dev) y se despliega sin errores en Vercel.

🧩 FASE 2 — Parte pública completa
2.1. Listado de galerías /galerias

Claude debe:

Crear ruta app/galerias/page.tsx

Conectar Supabase → leer solo galerías publicadas

Mostrar grid responsivo usando <GalleryGrid />

Crear <GalleryCard />, mostrando:

Título

Categoría

Fecha

Portada (puede ser cualquier foto de la galería)

2.2. Galería individual /galerias/[slug]

Claude debe:

Crear ruta dinámica para galería

Consultar datos de galería + fotos

Crear <PhotoGrid /> para las miniaturas

Crear <Lightbox /> con:

Navegación anterior/siguiente

Favoritos por foto (localStorage)

Crear contador de favoritas visible

Objetivo:
El visitante puede:

ver galerías

abrir fotos en pantalla completa

marcar favoritas

🧩 FASE 3 — Panel admin
3.1. Login admin

Claude debe:

Crear ruta /admin/login

Implementar login usando Supabase Auth

Al iniciar sesión → redirect a /admin/dashboard

Si ya está logueado → saltar login

3.2. Dashboard

Claude debe:

Crear /admin/dashboard

Mostrar:

Botón “Crear nueva galería”

Tabla de últimas galerías

Usar un layout persistente para páginas admin (admin/layout.tsx)

3.3. Listado de galerías admin

Claude debe:

Crear /admin/galerias

Mostrar tabla con:

Título

Categoría

Fecha

Estado

Fotos count

3.4. Crear nueva galería

Claude debe:

Crear /admin/galerias/nueva

Implementar formulario usando <GalleryForm />

Guardar en la tabla galleries

Autogenerar slug a partir del título

Redirigir a edición

3.5. Editar galería

Claude debe:

Crear /admin/galerias/[id]

Formulario editable

Botón “Publicar / Despublicar”

Sección de fotos (lista + eliminar)

🧩 FASE 4 — Subida de fotos (Supabase Storage)

Claude debe:

Crear el componente <PhotoUploadArea /> con:

Drag & drop + selección

Subida múltiple

Conectar a Supabase Storage:

bucket: gallery-images

ruta: galleries/<gallery_id>/<filename>

Registrar cada foto:

Guardar storage_path y public_url en la tabla photos

Mostrar miniaturas en el panel admin

Permitir eliminar fotos (DB + Storage)

Objetivo al finalizar:
Un admin puede crear una galería real + subir fotos completas sin backend propio.

🧩 FASE 5 — UX, validaciones y limpieza

Claude debe:

Añadir loading states donde aplique.

Añadir mensajes de error amigables.

Mejorar responsividad del grid.

Pulir animaciones del Lightbox.

Verificar que favoritos persisten con localStorage.

Revisar fluidez general.

🔷 4. Convenciones obligatorias
4.1. Código

Todo en TypeScript

Usar Server Components donde aplique

Usar Client Components solo donde haya:

Interactividad

Estado local

Hooks

Seguir estructura modular descrita en este archivo

4.2. Estilado

Solo Tailwind CSS

No usar componentes de librerías externas salvo petición expresa

4.3. Supabase

Todas las queries deben:

Ser tipadas

Manejar errores con claridad

Ser implementadas en Server Components cuando sea posible

🔷 5. Flujos de validación que Claude debe respetar

Antes de escribir código nuevo:

Revisar que no contradiga MVP_SPEC.md.

Antes de modificar archivos existentes:

Explicar brevemente qué hará.

Mostrar diff limpio.

Antes de avanzar de fase:

Confirmar que todo lo solicitado en esta fase está implementado.

Validar que el proyecto compila y corre.

🔷 6. Qué debe hacer Claude al recibir el mensaje:

“Sigue DEV_PLAN.md y MVP_SPEC.md para construir el proyecto.”

Debe ejecutar en este orden:

Leer ambos archivos por completo.

Crear scaffold del proyecto (FASE 1).

Esperar confirmación del usuario para continuar.

Implementar FASE 2.

Esperar confirmación.

Implementar FASE 3.

Confirmación.

Implementar FASE 4.

Confirmación.

Implementar FASE 5.

Confirmar finalización.

🔷 7. Criterio de finalización

El proyecto está terminado cuando:

Funciona localmente (npm run dev).

Funciona desplegado en Vercel.

Desde el panel admin:

Se puede crear galería.

Se pueden subir fotos.

Se pueden publicar galerías.

Visitantes:

Pueden ver galerías reales.

Pueden abrir fotos en lightbox.

Pueden marcar favoritas.

Todas las rutas cumplen UX mínima aceptable.

🔷 8. Nota final para Claude Code

Nunca improvisar fuera de las especificaciones.
Si algo no está definido:

revisar MVP_SPEC.md

aplicar buenas prácticas de Next.js

elegir la opción más simple y consistente

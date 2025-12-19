-- Script para eliminar galerías antiguas de forma segura
-- Ejecutar en el SQL Editor de Supabase

-- PASO 1: Eliminar TODAS las solicitudes de fotos de las galerías que quieres borrar
-- (Si quieres conservar el historial, NO ejecutes este paso y usa la Solución 2)
DELETE FROM photo_requests
WHERE gallery_id IN (
  -- Lista aquí los IDs de las galerías que quieres eliminar
  '19924af9-ef91-4a21-bfd7-b75fd7dff731',
  '2c7c2460-1410-47ac-b69a-0e538f3712aa'
  -- Agrega más IDs según necesites, separados por comas
);

-- PASO 2: Eliminar las fotos de las galerías
DELETE FROM photos
WHERE gallery_id IN (
  '19924af9-ef91-4a21-bfd7-b75fd7dff731',
  '2c7c2460-1410-47ac-b69a-0e538f3712aa'
);

-- PASO 3: Finalmente eliminar las galerías
DELETE FROM galleries
WHERE id IN (
  '19924af9-ef91-4a21-bfd7-b75fd7dff731',
  '2c7c2460-1410-47ac-b69a-0e538f3712aa'
);

-- NOTA: Este script NO limpia los archivos del Storage.
-- Para limpiar el storage, ve a Storage > gallery-images y elimina manualmente
-- las carpetas de estas galerías.

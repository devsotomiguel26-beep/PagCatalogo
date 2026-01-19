-- ============================================================================
-- Query para encontrar TODAS las vistas en el esquema public
-- ============================================================================
-- Ejecuta esta query en Supabase SQL Editor para ver todas las vistas
-- que existen en tu base de datos
-- ============================================================================

SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- Query alternativa: Vistas que dependen específicamente de photo_requests
-- ============================================================================
-- Esta query muestra vistas que referencian la tabla photo_requests
-- (pero puede no funcionar en todas las versiones de PostgreSQL)

SELECT DISTINCT
  dependent_view.relname as view_name
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace ON dependent_view.relnamespace = pg_namespace.oid
WHERE source_table.relname = 'photo_requests'
  AND dependent_view.relkind = 'v'
  AND pg_namespace.nspname = 'public'
ORDER BY view_name;

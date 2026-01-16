-- Agregar categoría "Todas" para eventos multi-categoría
-- Esta categoría se usa cuando un evento incluye múltiples categorías
-- (ej: Día de la Familia, Torneos Generales, etc.)

INSERT INTO categories (name, slug)
VALUES ('Todas', 'todas')
ON CONFLICT (slug) DO NOTHING;

-- Verificar categorías
SELECT id, name, slug FROM categories ORDER BY name;

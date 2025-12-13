# Directorio de Marca de Agua

## 📸 Logo Requerido

Este directorio debe contener el logo de Diablos Rojos para usar como marca de agua en las fotos de la galería.

### Archivo Requerido:
- **Nombre:** `logo.png`
- **Ubicación:** `/public/watermark/logo.png`

### Especificaciones del Logo:

**Formato:**
- ✅ PNG con transparencia (canal alpha)
- ❌ NO JPG (no soporta transparencia)

**Tamaño:**
- **Recomendado:** 1000px - 2000px de ancho
- El sistema lo redimensionará automáticamente al 50% del ancho de cada foto

**Fondo:**
- ✅ Transparente (para que se vea bien sobre cualquier foto)
- El logo debe ser legible sobre fondos claros y oscuros

**Color:**
- Preferiblemente logo blanco o rojo con borde/sombra
- Evitar logos muy oscuros sin contraste

### Ejemplo de Configuración:

```typescript
// La marca de agua se aplicará con estas opciones:
{
  opacity: 50,          // 50% de opacidad
  position: 'center',   // Centrado en diagonal
  scale: 0.5           // 50% del ancho de la imagen
}
```

### ¿Cómo obtener el logo?

1. Exporta el logo de Diablos Rojos en formato PNG con fondo transparente
2. Asegúrate de que tenga buena resolución (mínimo 1000px)
3. Guárdalo como `logo.png` en este directorio
4. Verifica que el archivo sea `/public/watermark/logo.png`

### Verificación:

```bash
# Desde la raíz del proyecto, ejecuta:
ls -lh public/watermark/logo.png

# Deberías ver algo como:
# -rw-r--r-- 1 user group 150K Dec 13 10:00 public/watermark/logo.png
```

---

**⚠️ IMPORTANTE:** Sin este archivo, las fotos NO se subirán con marca de agua y el proceso de upload fallará.

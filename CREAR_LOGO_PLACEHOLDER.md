# Crear Logo Placeholder Temporal

## Opción 1: Usar Figma/Photoshop (Recomendado)

1. Crea un nuevo documento 1500x1500px
2. Fondo transparente
3. Agrega texto "DIABLOS ROJOS" en rojo (#dc2626)
4. Usa fuente bold, grande
5. Agrega un borde blanco o sombra para visibilidad
6. Exporta como PNG con transparencia
7. Guarda en `/public/watermark/logo.png`

## Opción 2: Usar ImageMagick (Desde Terminal)

Si tienes ImageMagick instalado:

```bash
cd /Users/mgl26/Desarrollo/PagCatalogo/public/watermark

# Crear logo de texto simple
convert -size 1500x400 xc:none \
  -font Arial-Bold -pointsize 120 \
  -fill '#dc2626' \
  -stroke white -strokewidth 3 \
  -gravity center \
  -annotate +0+0 'DIABLOS ROJOS' \
  logo.png
```

## Opción 3: Descargar Logo Existente

Si Diablos Rojos ya tiene logo en su sitio web:

```bash
cd /Users/mgl26/Desarrollo/PagCatalogo/public/watermark

# Descargar desde URL (reemplaza con la URL real)
curl -o logo.png "https://diablosrojoscl.com/path/to/logo.png"

# O si es JPG, convertir a PNG con fondo transparente (requiere ImageMagick)
convert input-logo.jpg -transparent white logo.png
```

## Verificar el Logo Creado

```bash
cd /Users/mgl26/Desarrollo/PagCatalogo

# Verificar que existe
ls -lh public/watermark/logo.png

# Ver información del archivo (requiere ImageMagick)
identify public/watermark/logo.png

# Debería mostrar algo como:
# logo.png PNG 1500x400 1500x400+0+0 8-bit sRGBA 50KB
```

## Logo Placeholder de Emergencia (Solo Texto)

Si necesitas algo inmediato para probar:

1. Busca cualquier logo de Diablos Rojos en Google Images
2. Descárgalo como PNG
3. Ábrelo en Preview/Paint
4. Exporta con fondo transparente (si es posible)
5. Guárdalo como `logo.png` en `/public/watermark/`

**⚠️ Nota:** Este es solo temporal para probar. Reemplázalo con el logo oficial antes de producción.

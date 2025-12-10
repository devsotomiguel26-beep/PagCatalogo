# Configuración de Precios

Este documento explica cómo configurar y modificar el precio por foto en el sistema.

---

## Método Actual: Variable de Entorno ✅

### Configuración en Desarrollo (Local)

Edita tu archivo `.env.local`:

```bash
# Precio por foto en pesos chilenos (CLP)
PRICE_PER_PHOTO=2000
```

Reinicia el servidor de desarrollo:
```bash
npm run dev
```

### Configuración en Producción (Vercel)

**Opción A: Desde Vercel Dashboard**

1. Ve a https://vercel.com/
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Busca `PRICE_PER_PHOTO` (o agrégala si no existe)
5. Cambia el valor (ejemplo: `500` para pruebas, `2000` para producción)
6. Haz clic en **Save**
7. **Importante:** Vercel hará **redeploy automático**

**Opción B: Desde CLI (si tienes Vercel CLI instalado)**

```bash
vercel env add PRICE_PER_PHOTO production
# Ingresa el valor cuando te lo pida
# Ejemplo: 500 (para prueba) o 2000 (para producción)
```

### Verificar precio actual

Para ver qué precio está configurado actualmente, puedes crear una solicitud de prueba y ver el monto en Flow, o verificar directamente en Vercel:

**Dashboard:** Settings → Environment Variables → `PRICE_PER_PHOTO`

---

## Ejemplos de Configuración

### Para pruebas con pago real mínimo:

```bash
PRICE_PER_PHOTO=350
```

**Costo de 1 foto:** $350 CLP (~$0.40 USD)
**Costo de prueba con 3 fotos:** $1,050 CLP (~$1.20 USD)

### Para producción normal:

```bash
PRICE_PER_PHOTO=2000
```

**Costo de 1 foto:** $2,000 CLP (~$2.30 USD)
**Costo de 10 fotos:** $20,000 CLP (~$23 USD)

### Para promociones/descuentos:

```bash
PRICE_PER_PHOTO=1500
```

**Costo de 1 foto:** $1,500 CLP (~$1.70 USD)

---

## Cambio de Precio: Paso a Paso

### Escenario 1: Quiero hacer prueba con precio bajo

**Objetivo:** Probar el flujo completo con un pago real mínimo.

1. Ve a Vercel Dashboard
2. Settings → Environment Variables
3. Cambia `PRICE_PER_PHOTO` a `350`
4. Espera el redeploy (~2 minutos)
5. Haz tu prueba de pago
6. **IMPORTANTE:** Vuelve a cambiar a `2000` después de la prueba

### Escenario 2: Cambio de precio permanente

**Objetivo:** Ajustar precio por cambio de estrategia de negocio.

1. Decide el nuevo precio (ejemplo: `1800`)
2. Ve a Vercel Dashboard
3. Settings → Environment Variables
4. Cambia `PRICE_PER_PHOTO` a `1800`
5. Vercel redeploya automáticamente
6. Nuevos pagos usarán el precio actualizado
7. **Nota:** Los pagos en proceso usan el precio que tenían al crearse

### Escenario 3: Precio promocional temporal

**Objetivo:** Promoción por tiempo limitado.

**Día 1 - Activar promoción:**
1. Cambia `PRICE_PER_PHOTO` a `1500`
2. Espera redeploy
3. Anuncia promoción

**Día X - Terminar promoción:**
1. Cambia `PRICE_PER_PHOTO` de vuelta a `2000`
2. Espera redeploy

---

## ⚠️ Consideraciones Importantes

### 1. Los cambios requieren redeploy

- Cada cambio de variable de entorno dispara un redeploy automático
- El redeploy toma ~1-2 minutos
- Durante el redeploy, el sitio sigue funcionando (usa la versión anterior)

### 2. Los pagos en proceso no se afectan

- Si un usuario ya creó una solicitud, el precio queda fijo
- Solo los NUEVOS pagos usan el precio actualizado
- Esto evita confusiones con clientes

### 3. Mínimo de Flow

- Flow requiere un mínimo de **$350 CLP** por transacción
- No puedes configurar menos de $350 por foto

### 4. Historial de cambios

- Vercel NO guarda historial de cambios de variables de entorno
- Recomendación: Documenta cambios de precio en un archivo o notion

---

## 🚀 Próxima Evolución: Base de Datos (Futuro)

Para mayor flexibilidad operativa, se puede migrar a un sistema de configuración en base de datos:

### Ventajas futuras:

- ✅ Cambios sin redeploy (inmediatos)
- ✅ Historial de cambios de precio
- ✅ Panel de admin para configurar
- ✅ Diferentes precios por:
  - Categoría de evento
  - Galería específica
  - Rango de fechas (promociones automáticas)
  - Cantidad de fotos (descuentos por volumen)

### Tabla de configuración (propuesta futura):

```sql
CREATE TABLE settings (
  key VARCHAR PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP,
  updated_by TEXT
);

INSERT INTO settings VALUES
  ('price_per_photo', '2000', 'Precio base por foto en CLP', NOW(), 'admin');
```

### Panel de admin (propuesta futura):

```
┌─────────────────────────────────────────┐
│ Configuración de Precios                │
├─────────────────────────────────────────┤
│                                         │
│ Precio por foto:                        │
│ ┌─────────────┐                         │
│ │ $ 2000 CLP  │ [Guardar]              │
│ └─────────────┘                         │
│                                         │
│ Última modificación:                    │
│ 2025-12-10 14:30 por admin@example.com │
│                                         │
│ Historial de cambios:                   │
│ • 2025-12-10 14:30: $2000 → $2000      │
│ • 2025-12-05 10:15: $2500 → $2000      │
│ • 2025-12-01 09:00: $2000 → $2500      │
│                                         │
└─────────────────────────────────────────┘
```

**¿Cuándo implementar esto?**

Cuando tengas:
- Más de 50 ventas al mes
- Necesidad de cambiar precios frecuentemente
- Promociones automáticas por fechas
- Múltiples personas administrando el sistema

---

## FAQ

**Q: ¿Puedo tener diferentes precios por galería?**
A: Actualmente no. Todas las fotos cuestan lo mismo. En el futuro se puede implementar precios por galería.

**Q: ¿El precio incluye IVA?**
A: El precio que configures es el precio final que paga el cliente. Flow descuenta su comisión (~3.5%) de ese monto.

**Q: ¿Qué pasa si cambio el precio mientras alguien está comprando?**
A: El cliente verá el precio que había cuando hizo la solicitud. El cambio solo afecta nuevas solicitudes.

**Q: ¿Puedo hacer descuentos por cantidad?**
A: Actualmente no. Precio es fijo por foto. Se puede implementar en el futuro.

**Q: ¿Cómo hago una promoción de "2x1"?**
A: Cambiarías el precio a la mitad temporalmente. Ejemplo: De $2000 a $1000.

---

## Resumen Rápido

### Para cambiar precio AHORA:

```
1. Vercel Dashboard → Settings → Environment Variables
2. Editar PRICE_PER_PHOTO
3. Cambiar valor (ejemplo: 350 para prueba, 2000 para producción)
4. Save
5. Esperar ~2 minutos
6. Listo ✅
```

### Para ver precio actual:

```
Vercel Dashboard → Settings → Environment Variables → PRICE_PER_PHOTO
```

### Precio mínimo:

```
350 CLP (mínimo de Flow)
```

### Precio recomendado producción:

```
2000 CLP por foto
```

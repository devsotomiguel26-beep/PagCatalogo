# 🔧 Migración: Sistema de Validación de Pagos

## ¿Qué hace esta migración?

Agrega la capacidad de ver comprobantes de pago completos desde Flow en el panel de administración.

## 📋 Pasos para ejecutar (2 minutos)

### 1. Abrir Supabase Dashboard
- URL: https://supabase.com/dashboard
- Login con tu cuenta
- Selecciona proyecto: **PagCatalogo** (hknjkutorfzevjibbupu)

### 2. Ir a SQL Editor
- Click en **"SQL Editor"** en el menú lateral
- Click en **"New Query"**

### 3. Ejecutar el SQL
- Copia **TODO** el contenido de: `supabase-fix-missing-columns.sql`
- Pega en el editor
- Click **"Run"** (o Cmd/Ctrl + Enter)

### 4. Verificar resultado
Deberías ver:
```
✅ Success. No rows returned
```

Y en los resultados de las queries SELECT:
```
total_paid_requests | with_flow_order | with_payment_data
--------------------+-----------------+------------------
                  X |               X |                 0
```

(Es normal que payment_data sea 0 en pagos existentes)

## 🧪 Verificar localmente

Después de ejecutar en Supabase, verifica que funcionó:

```bash
node verificar-migracion.mjs
```

Deberías ver:
```
✅ La migración YA está aplicada
   La columna payment_data existe
```

## 🎯 Cómo usar

1. Espera a que llegue un nuevo pago (o haz una prueba)
2. Ve a `/admin/solicitudes`
3. En solicitudes pagadas verás botón **"Ver Pago"** 🧾
4. Click para ver comprobante completo de Flow

## ❓ Troubleshooting

### "permission denied for table photo_requests"
- Asegúrate de estar ejecutando en el SQL Editor de Supabase Dashboard
- No uses el cliente JavaScript para esto

### "column already exists"
- La migración ya fue aplicada
- Puedes ignorar este error

### No veo el botón "Ver Pago"
- Solo aparece en solicitudes con `status != 'pending'`
- Solo en solicitudes que tienen `payment_data` (pagos nuevos después de la migración)
- Pagos antiguos NO tendrán el botón (se captura desde el próximo pago)

---

## ✅ ESTADO: MIGRACIÓN COMPLETADA

**Fecha de ejecución**: 2026-01-18
**Resultado**: Exitoso ✅

Columnas verificadas:
- ✅ flow_order (BIGINT)
- ✅ payment_data (JSONB)
- ✅ payment_date (TIMESTAMPTZ)
- ✅ transaction_details (JSONB)
- ✅ settlement_status (TEXT)

El sistema de validación de pagos está completamente operativo.

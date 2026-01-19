# 🧹 Sistema de Gestión de Datos - Solicitudes de Fotos

## 📋 Resumen

Este sistema resuelve 3 problemas críticos identificados en el crecimiento del negocio:

1. **Solicitudes Abandonadas**: Pendientes que nunca pagan y contaminan el listado
2. **Solicitudes de Prueba**: Datos de testing que afectan reportes y liquidaciones
3. **Falta de Organización**: Imposibilidad de distinguir datos reales de ruido

## ✅ ¿Qué se implementó?

### 1. Nuevas Columnas en `photo_requests`

```sql
is_test              BOOLEAN    -- Marca solicitudes de prueba
is_archived          BOOLEAN    -- Marca solicitudes archivadas
cancelled_at         TIMESTAMPTZ -- Fecha de cancelación
cancelled_by         VARCHAR    -- Quién canceló (admin/system/user)
cancel_reason        TEXT       -- Razón de la cancelación
```

### 2. Nuevos Estados

Además de `pending`, `paid`, `delivered`, `expired`, ahora hay:

- **`cancelled`**: Solicitud cancelada manualmente por admin
- **`abandoned`**: Solicitud pendiente >48h sin pago (automático)

### 3. Vistas SQL Actualizadas

Todas las vistas de ganancias ahora **excluyen automáticamente** solicitudes de prueba:

- `pending_earnings` → Solo solicitudes reales
- `photographer_earnings_summary` → Solo ganancias reales
- `director_earnings_summary` → Solo ganancias reales

**Resultado**: Las liquidaciones NUNCA incluirán solicitudes de prueba.

### 4. Funciones SQL

```sql
-- Marcar solicitud como abandonada
SELECT mark_as_abandoned('request-uuid', 'Razón');

-- Marcar solicitud como prueba
SELECT mark_as_test('request-uuid');

-- Cancelar solicitud
SELECT cancel_request('request-uuid', 'admin', 'Razón');
```

### 5. Script de Gestión

`manage-abandoned-requests.mjs` permite:

- **Modo CHECK**: Ver qué solicitudes pendientes tienen >48h (sin modificar)
- **Modo EXECUTE**: Marcarlas como abandonadas automáticamente

```bash
# Ver qué se marcaría (dry run)
node manage-abandoned-requests.mjs check

# Marcar como abandonadas (real)
node manage-abandoned-requests.mjs execute
```

### 6. Interfaz Admin Mejorada

#### Nuevos Filtros de Vista

- **✅ Activas**: Solo solicitudes reales (excluye pruebas y archivadas) → **PREDETERMINADO**
- **📋 Todas**: Incluye todo sin filtrar
- **🧪 Pruebas**: Solo solicitudes de prueba
- **🗑️ Abandonadas**: Pendientes >48h
- **📦 Archivadas**: Historial antiguo

#### Nuevos Filtros de Estado

Ahora puedes filtrar por:
- Pendientes
- Pagadas
- Entregadas
- Expiradas
- **Canceladas** (nuevo)
- **Abandonadas** (nuevo)

#### Nuevas Acciones

En cada solicitud ahora hay:

- **🧪 Marcar como Prueba**: Excluye de reportes/liquidaciones
- **❌ Cancelar**: Cancela solicitud pendiente con razón

#### Indicadores Visuales

Las solicitudes marcadas como prueba o archivadas muestran badges:
- 🧪 Prueba
- 📦 Archivada

---

## 🚀 Cómo Empezar

### Paso 1: Ejecutar Migración SQL

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Abrir archivo `supabase-complete-cleanup-migration.sql`
3. Copiar todo el contenido
4. Pegar en el editor
5. Click **"Run"**

**Esto es seguro en producción**. Las columnas tienen valores DEFAULT, no afecta datos existentes.

### Paso 2: Limpiar Solicitudes Viejas (Opcional)

Si tienes solicitudes pendientes antiguas que quieres marcar como abandonadas:

```bash
# 1. Ver cuáles serían marcadas
node manage-abandoned-requests.mjs check

# 2. Si estás de acuerdo, marcarlas
node manage-abandoned-requests.mjs execute
```

### Paso 3: Marcar Solicitudes de Prueba

Ir al admin de solicitudes:

1. Cambiar vista a **"📋 Todas"** para ver todas
2. Identificar solicitudes de prueba
3. Click **"Marcar como Prueba"** en cada una
4. Cambiar vista a **"✅ Activas"** → ya no aparecerán

---

## 📊 Flujos de Trabajo

### Flujo 1: Manejo de Solicitudes Abandonadas

```
Solicitud creada
    ↓
status = 'pending'
    ↓
[Espera 48 horas]
    ↓
¿Cliente pagó?
    ├─ SÍ → Flujo normal
    └─ NO → Ejecutar: node manage-abandoned-requests.mjs execute
        ↓
        status = 'abandoned'
        cancelled_at = NOW()
        cancelled_by = 'system'
        ↓
        Ya no contamina el listado principal (vista "Activas")
```

### Flujo 2: Manejo de Solicitudes de Prueba

```
Solicitud de prueba creada
    ↓
Admin identifica que es prueba
    ↓
Click "Marcar como Prueba"
    ↓
is_test = TRUE
    ↓
Efectos:
- No aparece en vista "Activas" (predeterminada)
- NO incluida en liquidaciones
- NO incluida en reportes de ganancias
- NO afecta estadísticas de producción
```

### Flujo 3: Cancelación Manual

```
Solicitud pending/paid
    ↓
Admin decide cancelar
    ↓
Click "Cancelar"
    ↓
Ingresar razón
    ↓
status = 'cancelled'
cancelled_at = NOW()
cancelled_by = 'admin'
cancel_reason = 'Razón ingresada'
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente Nunca Paga

**Problema**: Solicitud lleva 5 días en pending, cliente no responde.

**Solución**:
1. Esperar automáticamente 48h
2. Ejecutar `node manage-abandoned-requests.mjs execute`
3. Solicitud marcada como `abandoned`
4. Ya no aparece en listado principal

### Caso 2: Pruebas del Sistema

**Problema**: Hiciste 10 solicitudes de prueba que contaminan reportes.

**Solución**:
1. Ir a Admin → Solicitudes → Vista "📋 Todas"
2. Para cada solicitud de prueba: Click "🧪 Marcar como Prueba"
3. Cambiar a vista "✅ Activas" → ya no aparecen
4. Las liquidaciones nunca las incluirán

### Caso 3: Cliente Cancela Antes de Pagar

**Problema**: Cliente escribió diciendo que ya no quiere las fotos.

**Solución**:
1. Buscar su solicitud
2. Click "Cancelar"
3. Ingresar razón: "Cliente solicitó cancelación"
4. status → `cancelled`

### Caso 4: Generar Liquidación Limpia

**Antes**: Liquidaciones incluían solicitudes de prueba, inflando montos.

**Ahora**:
1. Marcar solicitudes de prueba con "🧪 Marcar como Prueba"
2. Al generar liquidación → automáticamente excluidas
3. Montos 100% reales, sin contaminación

---

## 📈 Reportes y Estadísticas

### Queries Útiles

#### Ver distribución actual

```sql
SELECT
  status,
  is_test,
  is_archived,
  COUNT(*) as cantidad
FROM photo_requests
GROUP BY status, is_test, is_archived
ORDER BY is_test, is_archived, status;
```

#### Ver ganancias pendientes REALES (sin pruebas)

```sql
SELECT * FROM pending_earnings;
-- Automáticamente excluye is_test = true
```

#### Ver todas las solicitudes abandonadas

```sql
SELECT
  client_name,
  client_email,
  created_at,
  cancel_reason
FROM photo_requests
WHERE status = 'abandoned'
ORDER BY created_at DESC;
```

#### Ver solicitudes de prueba

```sql
SELECT
  client_name,
  status,
  created_at
FROM photo_requests
WHERE is_test = true
ORDER BY created_at DESC;
```

---

## 🔧 Mantenimiento

### Tarea Semanal Recomendada

```bash
# 1. Ver solicitudes pendientes viejas
node manage-abandoned-requests.mjs check

# 2. Si hay muchas, marcarlas como abandonadas
node manage-abandoned-requests.mjs execute
```

### Tarea Mensual Recomendada

```sql
-- Ver estadísticas generales
SELECT
  status,
  COUNT(*) as cantidad,
  COUNT(*) FILTER (WHERE is_test = true) as pruebas,
  COUNT(*) FILTER (WHERE is_archived = true) as archivadas
FROM photo_requests
GROUP BY status;
```

### Cronjob Futuro (Opcional)

Podrías automatizar el marcado de abandonadas con un cronjob:

```javascript
// Ejecutar diariamente a las 00:00
UPDATE photo_requests
SET
  status = 'abandoned',
  cancelled_at = NOW(),
  cancelled_by = 'system',
  cancel_reason = 'No se completó el pago en 48 horas'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours'
  AND is_test = FALSE;
```

---

## ⚠️ Advertencias Importantes

### ✅ Seguro

- Ejecutar migración SQL en producción
- Usar "Marcar como Prueba"
- Usar `manage-abandoned-requests.mjs check`

### ⚡ Con Precaución

- `manage-abandoned-requests.mjs execute` → revisa el check primero
- Cancelar solicitudes manualmente → asegúrate de que sea correcto

### ❌ Evitar

- Marcar como prueba solicitudes reales → se excluirán de liquidaciones
- Cancelar solicitudes que ya pagaron → usar solo en pending

---

## 📞 Preguntas Frecuentes

### P: ¿Qué pasa si marco como prueba una solicitud real?

**R**: Se excluirá de reportes y liquidaciones. Para revertir, ir a SQL:
```sql
UPDATE photo_requests
SET is_test = FALSE
WHERE id = 'uuid-de-la-solicitud';
```

### P: ¿Las solicitudes abandonadas se pueden reactivar si el cliente paga?

**R**: Sí, solo cambia el status. El webhook lo hará automáticamente si paga.

### P: ¿Cómo sé si una solicitud está en una liquidación?

**R**: Mira el campo `settlement_status`:
- `pending`: No liquidada
- `settled`: Ya incluida en liquidación

### P: ¿Puedo borrar solicitudes?

**R**: No recomendado. Mejor usa:
- `is_test = true` para pruebas
- `is_archived = true` para histórico viejo
- `status = 'cancelled'` para canceladas

### P: ¿Cómo afecta esto a liquidaciones existentes?

**R**: No afecta. Las liquidaciones ya creadas permanecen igual. Solo las NUEVAS liquidaciones excluirán pruebas.

---

## ✅ Checklist de Implementación

- [ ] Ejecutar `supabase-complete-cleanup-migration.sql` en Supabase
- [ ] Verificar que las columnas se crearon: `SELECT is_test, is_archived FROM photo_requests LIMIT 1;`
- [ ] Probar vista "Activas" en admin → debe mostrar solo solicitudes reales
- [ ] Marcar solicitudes de prueba existentes con "🧪 Marcar como Prueba"
- [ ] Ejecutar `node manage-abandoned-requests.mjs check` para ver pendientes viejas
- [ ] (Opcional) Ejecutar `node manage-abandoned-requests.mjs execute` si quieres limpiar
- [ ] Generar liquidación de prueba → verificar que NO incluye solicitudes marcadas como prueba
- [ ] Actualizar proceso de pruebas para marcar solicitudes como prueba al crearlas

---

**Última actualización**: 2026-01-19
**Versión del sistema**: 2.0 - Data Management

**Próximas mejoras sugeridas**:
- Cronjob automático para marcar abandonadas
- Dashboard de estadísticas con métricas de limpieza
- Exportar reportes sin pruebas

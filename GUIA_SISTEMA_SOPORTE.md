# Sistema Integral de Gestión de Entrega de Fotos

## Descripción General

Sistema completo para que el equipo de soporte pueda gestionar entregas de fotos a clientes, incluyendo reenvío, corrección de emails, regeneración de enlaces expirados y trazabilidad completa.

## Características Principales

### 1. Visibilidad del Estado de Entrega

Cada solicitud muestra claramente su estado de entrega con badges visuales:

- **⏸️ No enviado** (Gris): Las fotos nunca se han enviado
- **✅ Enviado (Xd restantes)** (Verde): Fotos enviadas con enlaces válidos
- **⏰ Expira en Xd** (Amarillo): Enlaces por expirar en menos de 2 días
- **⚠️ Enlaces expirados** (Rojo): Enlaces ya no funcionan, requiere reenvío

### 2. Información Detallada

Para cada solicitud se muestra:

- **Fecha de último envío**: Cuándo se enviaron las fotos
- **Email de destino**: Último email usado (puede diferir del original si se corrigió)
- **Días restantes**: Tiempo antes de que expiren los enlaces (7 días desde envío)
- **Contador de envíos**: Número de veces que se han enviado las fotos
- **Email original vs. corregido**: Si el email cambió, se muestra ambos

### 3. Modal Inteligente de Reenvío

Al hacer click en "Enviar/Reenviar fotos" se abre un modal que muestra:

#### Estado Actual
- Si nunca se envió: alerta amarilla
- Si se envió: fecha y hora del último envío
- Enlaces expirados: cuántos días hace que expiraron
- Enlaces válidos: cuántos días quedan
- Intentos previos: número de envíos anteriores

#### Formulario de Reenvío
- **Campo de email** con validación en tiempo real
- Muestra si el email cambió respecto al original
- Indica que se actualizará el email del cliente si cambió
- Validación de formato antes de enviar

#### Información Automática
- Los enlaces se regeneran automáticamente (nueva validez de 7 días)
- Se registra el envío en el historial
- Se notifica al admin por email

#### Historial de Entregas
- Lista de todos los envíos previos con:
  - Número de envío (#1, #2, etc.)
  - Fecha y hora
  - Email de destino
  - Si fue un reenvío
  - Si el email cambió
  - Cuándo expiraban los enlaces
  - Quién lo envió

### 4. Casos de Uso Resueltos

#### Caso 1: Cliente ingresó email incorrecto
**Problema**: Cliente hizo compra pero escribió mal su email
**Solución**:
1. Equipo de soporte identifica solicitud con email incorrecto
2. Click en "Reenviar fotos"
3. Edita el email en el modal
4. Click en "Reenviar Fotos"
5. Sistema actualiza el email del cliente y envía fotos
6. Se registra en historial que el email cambió

#### Caso 2: Email nunca llegó
**Problema**: Cliente dice que no recibió el correo
**Solución**:
1. Verificar en tabla que el estado es "Enviado"
2. Click en "Reenviar fotos"
3. Revisar que el email sea correcto
4. Click en "Reenviar Fotos" (al mismo email)
5. Cliente recibe nuevo email con enlaces
6. Se registra en historial como reenvío

#### Caso 3: Enlaces expirados (pasaron 7 días)
**Problema**: Cliente contacta después de 7 días
**Solución**:
1. Badge rojo indica "Enlaces expirados"
2. Click en "Reenviar fotos"
3. Modal muestra alerta de expiración
4. Click en "Reenviar Fotos"
5. Sistema regenera enlaces automáticamente (nuevos 7 días)
6. Cliente recibe email con enlaces renovados

#### Caso 4: Cliente quiere recibir por WhatsApp
**Problema**: Cliente prefiere recibir enlaces por WhatsApp
**Solución**:
1. Click en "Reenviar fotos" para generar enlaces frescos
2. Copiar email del cliente (botón de copiar)
3. Enviar por email primero (para generar enlaces)
4. Los enlaces también funcionan si se comparten por WhatsApp
5. Copiar enlaces individuales y enviarlos por WhatsApp

## Instalación y Configuración

### Paso 1: Ejecutar Migración SQL

Debes ejecutar la migración en Supabase para agregar las columnas necesarias:

1. Ve a tu dashboard de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el archivo `supabase-add-delivery-tracking.sql`:

```sql
-- Agregar columnas para trackear entregas y reenvíos de fotos

ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 0;

ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS delivery_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE photo_requests
ADD COLUMN IF NOT EXISTS last_delivery_email TEXT;
```

4. Verifica que las columnas se crearon correctamente

### Paso 2: Configurar Variables de Entorno

Asegúrate de tener configuradas en Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`: Para operaciones server-side
- `ADMIN_EMAIL`: Para recibir notificaciones de reenvíos
- `RESEND_API_KEY`: Para enviar emails

### Paso 3: Deploy

Los cambios ya están en el repositorio. Vercel desplegará automáticamente.

## Estructura de Archivos

```
app/
  api/
    resend-photos/
      route.ts              # API endpoint para reenviar fotos
  admin/
    solicitudes/
      page.tsx              # UI mejorada con gestión de entregas

components/
  admin/
    ResendPhotosModal.tsx   # Modal de reenvío con validación

supabase-add-delivery-tracking.sql  # Migración SQL
```

## API Endpoint: /api/resend-photos

### Parámetros

```typescript
{
  requestId: string;        // ID de la solicitud
  newEmail?: string;        // Nuevo email (opcional, usa original si no se provee)
  sentBy?: string;          // Quién envió (para auditoría)
}
```

### Respuesta Exitosa

```typescript
{
  success: true;
  message: string;
  photosSent: number;
  expiresAt: Date;
  deliveryAttempt: number;
  emailChanged: boolean;
  linksRegenerated: boolean;
}
```

### Qué Hace el API

1. Valida el email (si se provee uno nuevo)
2. Obtiene datos de la solicitud
3. Regenera enlaces de descarga (nuevos 7 días de validez)
4. Envía email al cliente con fotos
5. Actualiza historial de entregas en BD
6. Incrementa contador de intentos
7. Actualiza client_email si cambió
8. Notifica al admin por email

## Campos de Base de Datos

### photo_requests

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `delivery_attempts` | INTEGER | Número total de veces que se enviaron las fotos |
| `delivery_history` | JSONB | Array con historial completo de entregas |
| `last_delivery_email` | TEXT | Último email usado (puede diferir de client_email) |
| `photos_sent_at` | TIMESTAMP | Fecha del último envío |
| `download_links_expires_at` | TIMESTAMP | Cuándo expiran los enlaces actuales |

### Estructura de delivery_history

```typescript
{
  sentAt: string;           // ISO timestamp
  sentTo: string;           // Email de destino
  sentBy: string;           // Quién envió
  linksExpireAt: string;    // Cuándo expiran esos enlaces
  photoCount: number;       // Cantidad de fotos enviadas
  wasResend: boolean;       // Si fue un reenvío
  emailChanged: boolean;    // Si se cambió el email
}
```

## Flujo de Trabajo Recomendado

### Para el equipo de soporte

1. **Revisar solicitudes diariamente**
   - Filtrar por "Pagadas" para ver cuáles necesitan envío
   - Identificar solicitudes con badges rojos (expirados)

2. **Responder a tickets de soporte**
   - Buscar solicitud del cliente por nombre o email
   - Verificar estado de entrega en la tabla
   - Usar modal de reenvío para resolver el problema

3. **Auditoría y seguimiento**
   - Revisar contador de envíos para identificar casos problemáticos
   - Ver historial completo en el modal para entender qué pasó
   - Usar filtros para encontrar solicitudes específicas

## Notificaciones

### Email al Cliente

Cada vez que se envían/reenvían fotos, el cliente recibe:
- Asunto: "Tus fotos de [Galería] están listas"
- Links de descarga directos para cada foto
- Fecha de expiración de los enlaces
- Instrucciones de descarga

### Email al Admin

Cada reenvío notifica al admin con:
- Detalles del cliente
- Email original vs. nuevo (si cambió)
- Número de intento de entrega
- Quién lo envió
- Cuándo expiran los enlaces

## Métricas y Análisis

Con este sistema puedes analizar:

- **Tasa de reenvíos**: Solicitudes con delivery_attempts > 1
- **Emails incorrectos**: Solicitudes donde last_delivery_email ≠ client_email
- **Enlaces expirados**: Solicitudes con download_links_expires_at < NOW()
- **Tiempo de respuesta**: Diferencia entre created_at y photos_sent_at

## Seguridad y Privacidad

- Los enlaces de descarga expiran en 7 días (configurable)
- Se usa SERVICE_ROLE_KEY solo en servidor (nunca expuesta al cliente)
- Historial de entregas permite auditoría completa
- Validación de email antes de enviar
- Registro de quién realizó cada acción

## Troubleshooting

### Los emails no se envían
- Verifica que `RESEND_API_KEY` esté configurada en Vercel
- Revisa logs de Vercel para errores del API
- Confirma que `ADMIN_EMAIL` sea válida

### Error "No se pudieron generar links"
- Verifica que las fotos tengan `original_path` en BD
- Confirma que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
- Revisa permisos de Storage en Supabase

### El historial no se guarda
- Ejecuta la migración SQL si no lo has hecho
- Verifica que la columna `delivery_history` exista y sea tipo JSONB
- Revisa logs para errores de actualización de BD

## Mejoras Futuras (Opcionales)

1. **Dashboard de métricas**: Gráficos de entregas, reenvíos, etc.
2. **Templates de email personalizables**: Editar contenido del email
3. **Notificaciones automáticas**: Alertar cuando enlaces estén por expirar
4. **Bulk operations**: Reenviar múltiples solicitudes a la vez
5. **Exportar historial**: Descargar CSV de todas las entregas
6. **Integración con WhatsApp**: Enviar enlaces directamente por WhatsApp Business API

## Soporte

Si tienes problemas o preguntas sobre el sistema:
1. Revisa esta guía primero
2. Verifica que ejecutaste la migración SQL
3. Confirma variables de entorno en Vercel
4. Revisa logs en Vercel para detalles de errores

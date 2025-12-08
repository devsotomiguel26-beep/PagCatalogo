# Guía de Solución de Problemas - Login Admin

## 🔐 Problema: No puedo iniciar sesión en /admin/login

### Paso 1: Verificar que el usuario está creado correctamente en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Ve a **Authentication** → **Users**
3. Verifica que el usuario aparezca en la lista
4. **IMPORTANTE**: Verifica el estado del usuario:
   - ✅ **Confirmed**: El usuario debe tener el email confirmado
   - ❌ **Waiting for verification**: Si aparece así, el email NO está confirmado

### Paso 2: Confirmar el email del usuario

Si el usuario muestra "Waiting for verification" o no está confirmado:

**Opción A - Confirmar manualmente (Recomendado para testing):**
1. En Supabase Dashboard → Authentication → Users
2. Click en el usuario
3. Busca el toggle **"Auto Confirm User"** o **"Email Confirmed"**
4. Actívalo / márcalo como confirmado
5. Guarda los cambios

**Opción B - Deshabilitar confirmación de email:**
1. Ve a Authentication → Settings → Email Auth
2. Desactiva **"Enable email confirmations"**
3. Esto permite login sin confirmar email (solo para desarrollo)

### Paso 3: Verificar las credenciales

1. Asegúrate de usar el **mismo email** que está en Supabase
2. Verifica que la **contraseña** sea correcta (mínimo 6 caracteres)
3. No debe haber espacios extra al copiar/pegar

### Paso 4: Verificar las variables de entorno

Abre tu archivo `.env.local` y verifica:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-real
```

**Para obtener las correctas:**
1. Ve a Supabase Dashboard → Settings → API
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 5: Reiniciar el servidor de desarrollo

Después de cambiar `.env.local`:

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

**Las variables de entorno solo se leen al iniciar el servidor.**

### Paso 6: Verificar en la consola del navegador

1. Abre la página de login: `http://localhost:3000/admin/login`
2. Abre la consola del navegador (F12 o Click derecho → Inspeccionar)
3. Ve a la pestaña **Console**
4. Intenta iniciar sesión
5. Observa los mensajes:

**Si ves:**
- ✅ `✅ Login exitoso!` → Todo funciona
- ❌ `Invalid login credentials` → Email o contraseña incorrectos
- ❌ `Email not confirmed` → Necesitas confirmar el email (ver Paso 2)
- ❌ `User not found` → El usuario no existe en Supabase

### Paso 7: Verificar políticas RLS (Row Level Security)

En Supabase, las políticas RLS no deberían afectar al login, pero verifica:

1. Ve a Authentication en Supabase
2. Asegúrate de que la autenticación esté habilitada
3. Ve a SQL Editor y ejecuta:

```sql
-- Ver usuarios existentes
SELECT id, email, email_confirmed_at, created_at
FROM auth.users;
```

Esto te mostrará todos los usuarios y si están confirmados.

### Paso 8: Crear un nuevo usuario de prueba

Si nada funciona, crea un usuario nuevo:

```sql
-- En Supabase SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@admin.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  ''
);
```

Luego intenta con:
- Email: `test@admin.com`
- Password: `password123`

**O usa la interfaz:**
1. Authentication → Users → Add User
2. Email: `test@admin.com`
3. Password: `password123`
4. ✅ **Auto Confirm User** (importante!)
5. Create user

## 🐛 Errores Comunes

### Error: "Invalid login credentials"

**Causas:**
- Email o contraseña incorrectos
- Usuario no confirmado
- Usuario no existe

**Solución:**
- Verifica el email exacto en Supabase
- Confirma el usuario (Paso 2)
- Verifica la contraseña

### Error: "Email not confirmed"

**Causa:**
- El usuario no ha confirmado su email

**Solución:**
- Confirmar manualmente en Supabase (Paso 2)
- O deshabilitar confirmación de email (solo desarrollo)

### Error: Variables de entorno no definidas

**Causa:**
- `.env.local` no existe
- Variables mal copiadas
- Servidor no reiniciado

**Solución:**
- Verifica `.env.local` (Paso 4)
- Reinicia el servidor (Paso 5)

## ✅ Checklist Rápido

Marca cada ítem antes de pedir ayuda:

- [ ] Usuario existe en Supabase Authentication
- [ ] Email del usuario está confirmado (Auto Confirm User activo)
- [ ] Variables en `.env.local` son correctas
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Email y contraseña son exactamente los mismos que en Supabase
- [ ] Consola del navegador muestra los logs de debug

## 📞 Información para Debug

Si sigues teniendo problemas, comparte:

1. Mensaje de error en pantalla
2. Logs de la consola del navegador (F12 → Console)
3. Confirma que el usuario aparece en Supabase y está confirmado
4. Confirma que las variables de entorno están bien

## 🎯 Solución Rápida (90% de los casos)

**El problema más común es que el email no está confirmado.**

**Fix rápido:**
1. Ve a Supabase → Authentication → Users
2. Click en tu usuario
3. Activa "Auto Confirm User" o marca el email como confirmado
4. Guarda
5. Intenta iniciar sesión nuevamente

¡Eso debería funcionar! 🎉

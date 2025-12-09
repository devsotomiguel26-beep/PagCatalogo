# 🔧 Configuración DNS: Resend + Google Workspace

## 📋 Tu Situación Actual

- **Dominio**: diablosrojoscl.com (GoDaddy)
- **DNS**: Gestionados en Hostinger
- **Correos**: Google Workspace (envío/recepción)
- **Web**: Hostinger
- **Nuevo**: Resend (solo para emails automáticos de la app)

---

## ✅ LA SOLUCIÓN: Pueden Coexistir

**¡Buenas noticias!** Resend y Google Workspace pueden funcionar juntos sin problemas. Aquí está el por qué:

1. **Google Workspace** maneja:
   - Recepción de emails (registros MX)
   - Envío manual de emails desde Gmail
   - Tu email personal: tu-nombre@diablosrojoscl.com

2. **Resend** solo maneja:
   - Envío automático desde la aplicación (NextJS)
   - No recibe emails
   - No interfiere con Gmail

**Clave**: Usarás un **subdominio** o **selector específico** para Resend.

---

## 🎯 Estrategia Recomendada: Usar Subdominio

### Opción A: Subdominio Dedicado (MÁS SIMPLE - RECOMENDADO)

Usar un subdominio como `noreply.diablosrojoscl.com` para Resend.

**Ventajas:**
- ✅ No toca configuración de Google Workspace
- ✅ Separación clara de responsabilidades
- ✅ Más fácil de configurar
- ✅ Cero riesgo de romper email corporativo

**Desventajas:**
- ⚠️ Emails salen desde `noreply@noreply.diablosrojoscl.com` (poco estético)

### Opción B: Mismo Dominio (MÁS COMPLEJO PERO MEJOR)

Usar el dominio principal `diablosrojoscl.com` para ambos.

**Ventajas:**
- ✅ Emails salen desde `noreply@diablosrojoscl.com` (profesional)
- ✅ Branding consistente

**Desventajas:**
- ⚠️ Requiere combinar registros SPF
- ⚠️ Más configuración
- ⚠️ Riesgo mínimo si se hace mal

---

## 🚀 OPCIÓN A: Subdominio (RECOMENDADA PARA TI)

### Paso 1: Crear Subdominio en Resend

1. Ve a https://resend.com/domains
2. Click "Add Domain"
3. Ingresa: `noreply.diablosrojoscl.com`
4. Click "Add"

### Paso 2: Copiar Registros DNS de Resend

Resend te mostrará algo como:

```
SPF Record:
Type: TXT
Name: noreply
Value: v=spf1 include:_spf.resend.com ~all

DKIM Record 1:
Type: TXT
Name: resend._domainkey.noreply
Value: [largo string que Resend te da]

DKIM Record 2:
Type: TXT
Name: resend2._domainkey.noreply
Value: [otro largo string]

DKIM Record 3:
Type: TXT
Name: resend3._domainkey.noreply
Value: [otro largo string]
```

### Paso 3: Agregar en Hostinger DNS

1. Entra a Hostinger → Tu dominio → DNS/Name Servers
2. Busca la sección "DNS Records" o "Manage DNS"
3. Agrega CADA registro que Resend te dio:

**Ejemplo:**

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | noreply | v=spf1 include:_spf.resend.com ~all |
| TXT | resend._domainkey.noreply | [el valor largo que Resend te da] |
| TXT | resend2._domainkey.noreply | [el valor largo que Resend te da] |
| TXT | resend3._domainkey.noreply | [el valor largo que Resend te da] |

### Paso 4: Esperar Propagación

- Tiempo: 5 minutos a 48 horas (típicamente 15-30 min)
- Resend verifica automáticamente
- Cuando esté listo, verás un badge verde "Verified"

### Paso 5: Actualizar .env.local

```bash
RESEND_FROM_EMAIL=noreply@noreply.diablosrojoscl.com
```

**✅ LISTO!** Google Workspace sigue funcionando normal y Resend también.

---

## 🔥 OPCIÓN B: Mismo Dominio (Si quieres emails desde @diablosrojoscl.com)

### ⚠️ IMPORTANTE: Primero verifica tus registros actuales

Antes de hacer cambios, necesitas saber qué tienes configurado actualmente.

#### Ver tus registros DNS actuales:

**En Hostinger:**
1. Panel → Dominios → diablosrojoscl.com → DNS Zone
2. Anota TODOS los registros TXT y MX existentes

**Desde terminal (Mac/Linux):**
```bash
# Ver registros MX (email reception)
dig MX diablosrojoscl.com

# Ver registros TXT (SPF, DKIM, DMARC)
dig TXT diablosrojoscl.com

# Ver Google DKIM
dig TXT google._domainkey.diablosrojoscl.com
```

### Paso 1: Identificar Registros de Google Workspace

Deberías tener algo como:

**Registros MX (CRÍTICOS - NO TOCAR):**
```
Priority: 1
Value: ASPMX.L.GOOGLE.COM

Priority: 5
Value: ALT1.ASPMX.L.GOOGLE.COM

Priority: 5
Value: ALT2.ASPMX.L.GOOGLE.COM
...
```

**Registro SPF actual:**
```
Type: TXT
Name: @ (o diablosrojoscl.com)
Value: v=spf1 include:_spf.google.com ~all
```

**Registros DKIM de Google:**
```
Type: TXT
Name: google._domainkey
Value: [string largo de Google]
```

### Paso 2: Agregar Dominio en Resend

1. Ve a https://resend.com/domains
2. Click "Add Domain"
3. Ingresa: `diablosrojoscl.com`
4. Click "Add"

### Paso 3: Combinar Registros SPF

**CRÍTICO**: Solo puedes tener UN registro SPF por dominio.

**Antes (solo Google):**
```
v=spf1 include:_spf.google.com ~all
```

**Después (Google + Resend):**
```
v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

En Hostinger:
1. Busca el registro TXT con valor que empieza con `v=spf1`
2. **EDITA** (no crees uno nuevo)
3. Cambia el valor a: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`

### Paso 4: Agregar Registros DKIM de Resend

Resend te dará 3 registros DKIM con selectores diferentes a Google.

**Google usa:**
- `google._domainkey.diablosrojoscl.com`

**Resend usa:**
- `resend._domainkey.diablosrojoscl.com`
- `resend2._domainkey.diablosrojoscl.com`
- `resend3._domainkey.diablosrojoscl.com`

Son DIFERENTES, así que **NO hay conflicto**.

En Hostinger, agrega los 3 registros de Resend:

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | resend._domainkey | [valor largo de Resend] |
| TXT | resend2._domainkey | [valor largo de Resend] |
| TXT | resend3._domainkey | [valor largo de Resend] |

**NO toques** el registro `google._domainkey`

### Paso 5: (Opcional) DMARC

Si tienes un registro DMARC, asegúrate que permite ambos:

```
v=DMARC1; p=none; rua=mailto:tu-email@diablosrojoscl.com
```

### Paso 6: NO Tocar Registros MX

**MUY IMPORTANTE**: Los registros MX de Google Workspace deben quedarse EXACTAMENTE como están. Ellos controlan la recepción de emails.

### Paso 7: Verificar y Actualizar .env.local

Una vez Resend verifique el dominio:

```bash
RESEND_FROM_EMAIL=noreply@diablosrojoscl.com
```

---

## 📊 Tabla Comparativa

| Aspecto | Opción A: Subdominio | Opción B: Mismo Dominio |
|---------|----------------------|-------------------------|
| **Dificultad** | 🟢 Fácil | 🟡 Media |
| **Riesgo** | 🟢 Ninguno | 🟡 Bajo |
| **Email desde** | noreply@noreply.diablosrojoscl.com | noreply@diablosrojoscl.com |
| **Tiempo setup** | 10 min | 20-30 min |
| **Toca Google** | ❌ No | ✅ Sí (SPF) |
| **Profesionalismo** | 🟡 Medio | 🟢 Alto |

---

## ✅ MI RECOMENDACIÓN PARA TI

**Usa Opción A (Subdominio)** porque:

1. ✅ Zero riesgo de afectar Google Workspace
2. ✅ Setup en 10 minutos
3. ✅ Separación clara (emails corporativos vs automáticos)
4. ✅ Fácil de revertir si algo sale mal
5. ✅ Los clientes no notan la diferencia práctica

**Nota sobre "poco estético":**
- Los clientes ven: `Diablos Rojos Foto <noreply@noreply.diablosrojoscl.com>`
- El nombre "Diablos Rojos Foto" es lo que importa
- El email técnico no afecta la entregabilidad

---

## 🧪 Cómo Probar que Funciona (Ambas Opciones)

### 1. Verificar en Resend
- Dashboard → Domains
- Debe decir "Verified" con badge verde

### 2. Enviar Email de Prueba
```bash
# En tu app, envia un email de prueba a tu email personal
# Verifica que llegue y no caiga en spam
```

### 3. Verificar Google Workspace Sigue Funcionando
- Envía un email desde Gmail (tu-nombre@diablosrojoscl.com)
- Pide a alguien que te responda
- Si recibes la respuesta, todo está OK

### 4. Verificar Registros DNS
```bash
# Ver SPF
dig TXT diablosrojoscl.com | grep spf

# Debe mostrar ambos includes:
# v=spf1 include:_spf.google.com include:_spf.resend.com ~all

# Ver DKIM de Resend
dig TXT resend._domainkey.diablosrojoscl.com
```

---

## ⚠️ Problemas Comunes y Soluciones

### "Resend no verifica el dominio"

**Causas:**
1. DNS no propagado aún (espera 1-2 horas)
2. Registros mal copiados
3. Typos en nombres de registros

**Solución:**
1. Verifica registro por registro en Hostinger
2. Usa herramienta: https://mxtoolbox.com/SuperTool.aspx
3. Ingresa cada registro para verificar

### "Emails de Resend van a spam"

**Causas:**
1. Dominio recién verificado (toma tiempo ganar reputación)
2. Falta DMARC
3. Contenido del email sospechoso

**Solución:**
1. Espera unos días (reputación se construye)
2. Agrega DMARC si no lo tienes
3. Pide a destinatarios marcar como "No spam"

### "Ya no recibo emails en Google Workspace"

**Causa:**
- Cambiaste o eliminaste registros MX por error

**Solución:**
1. Restaura registros MX de Google inmediatamente
2. Google tiene una guía: https://support.google.com/a/answer/174125
3. Los registros MX típicos son:
   ```
   1 ASPMX.L.GOOGLE.COM
   5 ALT1.ASPMX.L.GOOGLE.COM
   5 ALT2.ASPMX.L.GOOGLE.COM
   10 ALT3.ASPMX.L.GOOGLE.COM
   10 ALT4.ASPMX.L.GOOGLE.COM
   ```

---

## 📝 Checklist Final

Antes de hacer cambios:

- [ ] Anota TODOS tus registros DNS actuales (backup)
- [ ] Identifica registros MX de Google (NO tocar)
- [ ] Identifica registro SPF actual
- [ ] Decide: Opción A (subdominio) o Opción B (mismo dominio)
- [ ] Ten a mano acceso a Hostinger DNS
- [ ] Ten a mano acceso a Resend

Durante cambios:

- [ ] Copia exactamente los valores que Resend te da
- [ ] Si combinas SPF, verifica que tenga ambos `include:`
- [ ] NO elimines registros de Google
- [ ] Guarda cada cambio antes del siguiente

Después:

- [ ] Espera 15-30 min mínimo
- [ ] Verifica en Resend que aparezca "Verified"
- [ ] Envía email de prueba desde la app
- [ ] Envía email de prueba desde Gmail
- [ ] Confirma que ambos funcionan

---

## 🆘 Si Algo Sale Mal

1. **No entres en pánico**
2. **Revierte los cambios**:
   - Restaura registros DNS al estado anterior (tu backup)
   - Espera 30 min
3. **Contacta soporte**:
   - Resend: support@resend.com
   - Google Workspace: https://support.google.com/a/contact
   - Hostinger: Su chat de soporte

---

## 💡 Consejo Final

**Para tu primer intento, te recomiendo Opción A (subdominio):**

1. Es reversible 100%
2. No toca nada de Google
3. Funciona perfecto
4. Luego, si quieres, migras a Opción B con experiencia

**Configuración completa Opción A:**
```bash
# En Resend
Dominio: noreply.diablosrojoscl.com

# En .env.local
RESEND_FROM_EMAIL=noreply@noreply.diablosrojoscl.com
ADMIN_EMAIL=tu-email@diablosrojoscl.com  # Este sí va a Google Workspace

# Emails salen desde:
From: Diablos Rojos Foto <noreply@noreply.diablosrojoscl.com>

# Respuestas van a:
Reply-To: tu-email@diablosrojoscl.com  # Tu email de Google Workspace
```

---

¿Con cuál opción quieres ir? Te ayudo paso a paso. 🚀

# Enviar Fotos Manualmente

Si el webhook de Flow no funcionó y las fotos no se enviaron automáticamente, usa este método:

## Método 1: Desde el navegador (más fácil)

1. Ve a la página de solicitudes en el admin
2. Busca el ID de la solicitud que no recibió las fotos
3. Abre una nueva pestaña y ve a:
   ```
   http://localhost:3000/api/sync-payment
   ```

4. Abre las DevTools (F12) → Console
5. Ejecuta este código (reemplaza REQUEST_ID con el ID real):
   ```javascript
   fetch('/api/sync-payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       requestId: 'aaa5a216-53d0-44f0-aac0-65dc631ce966',  // ID de la solicitud
       flowOrder: '154149027'  // Flow Order del log (opcional)
     })
   })
   .then(res => res.json())
   .then(data => console.log('Resultado:', data))
   .catch(err => console.error('Error:', err));
   ```

## Método 2: Con curl (desde terminal)

```bash
curl -X POST http://localhost:3000/api/sync-payment \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"aaa5a216-53d0-44f0-aac0-65dc631ce966\",\"flowOrder\":\"154149027\"}"
```

## Lo que hace:

1. Marca el pago como confirmado
2. Genera links de descarga de las fotos originales (sin marca de agua)
3. Envía email al cliente con los links
4. Marca la solicitud como "fotos enviadas"
5. Envía notificación al admin (si está configurado)

## Verificar que funcionó:

- Revisa los logs de tu terminal donde corre `npm run dev`
- Deberías ver mensajes como:
  - ✅ X links generados
  - 📧 Enviando email al cliente
  - ✅ Email enviado
  - ✅ Solicitud marcada como "fotos enviadas"
- El cliente debería recibir un email con las fotos

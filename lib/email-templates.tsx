interface PhotoRequestEmailProps {
  clientName: string;
  childName: string;
  galleryTitle: string;
  photoCount: number;
}

export function getPhotoRequestConfirmationEmail({
  clientName,
  childName,
  galleryTitle,
  photoCount,
}: PhotoRequestEmailProps): { subject: string; html: string } {
  const subject = `Confirmación de solicitud - ${galleryTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Diablos Rojos Foto
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">
                ¡Solicitud recibida!
              </h2>

              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Hola <strong>${clientName}</strong>,
              </p>

              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Hemos recibido tu solicitud de fotos para <strong>${childName}</strong> de la galería <strong>${galleryTitle}</strong>.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 16px;">
                  Resumen de tu solicitud:
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #7f1d1d;">
                  <li style="margin-bottom: 4px;">Galería: ${galleryTitle}</li>
                  <li style="margin-bottom: 4px;">Niño/a: ${childName}</li>
                  <li style="margin-bottom: 4px;">Fotos seleccionadas: ${photoCount}</li>
                </ul>
              </div>

              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 18px;">
                ¿Qué sigue ahora?
              </h3>

              <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 12px;">
                  <strong>Nos pondremos en contacto contigo</strong> pronto para coordinar el pago.
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Una vez confirmado el pago,</strong> recibirás las fotos en alta resolución sin marca de agua.
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Las fotos se entregarán</strong> por correo electrónico o el método que acuerdes con nosotros.
                </li>
              </ol>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                  <strong>💡 Nota:</strong> Si tienes alguna pregunta o necesitas hacer cambios a tu solicitud, responde a este correo y te ayudaremos encantados.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                ¡Gracias por confiar en nosotros para capturar esos momentos especiales!
              </p>

              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
                Saludos,<br>
                <strong style="color: #dc2626;">Equipo Diablos Rojos Foto</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Este es un correo automático, por favor no responder directamente.<br>
                Para consultas, contacta con nosotros respondiendo a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

interface AdminNotificationEmailProps {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  childName: string;
  galleryTitle: string;
  photoCount: number;
  requestId: string;
}

export function getAdminNotificationEmail({
  clientName,
  clientEmail,
  clientPhone,
  childName,
  galleryTitle,
  photoCount,
  requestId,
}: AdminNotificationEmailProps): { subject: string; html: string } {
  const subject = `Nueva solicitud de fotos - ${clientName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Nueva Solicitud de Fotos
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Se ha recibido una nueva solicitud de fotos en el sistema.
              </p>

              <div style="background-color: #f3f4f6; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Cliente:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${clientEmail}" style="color: #dc2626; text-decoration: none;">${clientEmail}</a>
                    </td>
                  </tr>
                  ${clientPhone ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Teléfono:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="tel:${clientPhone}" style="color: #dc2626; text-decoration: none;">${clientPhone}</a>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Niño/a:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${childName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Galería:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${galleryTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Fotos:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${photoCount}</td>
                  </tr>
                </table>
              </div>

              <div style="margin: 32px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/admin/solicitudes"
                   style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Ver en Panel Admin
                </a>
              </div>

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ID de solicitud: <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${requestId}</code>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Notificación automática del sistema Diablos Rojos Foto
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

interface PhotoDeliveryEmailProps {
  clientName: string;
  childName: string;
  galleryTitle: string;
  photoCount: number;
  downloadLinks: Array<{ photoId: string; url: string; thumbnailUrl?: string }>;
  expiresAt: Date;
}

export function getPhotoDeliveryEmail({
  clientName,
  childName,
  galleryTitle,
  photoCount,
  downloadLinks,
  expiresAt,
}: PhotoDeliveryEmailProps): { subject: string; html: string } {
  const subject = `🎉 Tus fotos están listas para descargar - ${galleryTitle}`;

  const expirationDate = expiresAt.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = \`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 ¡Tus Fotos Están Listas!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Hola <strong>\${clientName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                ¡Excelentes noticias! Tu pago ha sido confirmado y las fotos de <strong>\${childName}</strong> de la galería <strong>\${galleryTitle}</strong> ya están disponibles para descargar.
              </p>
              <div style="margin: 24px 0;">
                \${downloadLinks.map((link, index) => \`
                <div style="margin-bottom: 12px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <span style="color: #374151; font-size: 14px;">📷 Foto \${index + 1}</span>
                  <a href="\${link.url}" download style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-left: 10px;">Descargar</a>
                </div>
                \`).join('')}
              </div>
              <p style="margin: 16px 0; color: #6b7280; font-size: 14px;">
                <strong>⚠️ Los links expiran el \${expirationDate}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  \`;

  return { subject, html };
}

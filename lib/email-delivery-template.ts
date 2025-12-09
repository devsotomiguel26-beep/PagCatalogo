interface PhotoDeliveryEmailProps {
  clientName: string;
  childName: string;
  galleryTitle: string;
  photoCount: number;
  downloadLinks: Array<{ photoId: string; url: string }>;
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

  const downloadLinksHtml = downloadLinks
    .map(
      (link, index) => `
    <div style="margin-bottom: 12px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #374151; font-size: 14px; font-weight: 500;">
          📷 Foto ${index + 1}
        </span>
        <a
          href="${link.url}"
          download
          style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;"
        >
          Descargar
        </a>
      </div>
    </div>
  `
    )
    .join('');

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
                Hola <strong>${clientName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                ¡Excelentes noticias! Tu pago ha sido confirmado y las fotos de <strong>${childName}</strong> de la galería <strong>${galleryTitle}</strong> ya están disponibles para descargar en alta resolución sin marca de agua.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 16px;">
                  📸 Resumen de tu pedido:
                </p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 4px 0; color: #7f1d1d;">Galería:</td>
                    <td style="padding: 4px 0; color: #7f1d1d; font-weight: bold;">${galleryTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #7f1d1d;">Niño/a:</td>
                    <td style="padding: 4px 0; color: #7f1d1d; font-weight: bold;">${childName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #7f1d1d;">Cantidad de fotos:</td>
                    <td style="padding: 4px 0; color: #7f1d1d; font-weight: bold;">${photoCount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #7f1d1d;">Disponible hasta:</td>
                    <td style="padding: 4px 0; color: #7f1d1d; font-weight: bold;">${expirationDate}</td>
                  </tr>
                </table>
              </div>
              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 20px;">
                📥 Descarga Tus Fotos
              </h3>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px;">
                Haz clic en los botones abajo para descargar cada foto en alta resolución:
              </p>
              <div style="margin: 24px 0;">
                ${downloadLinksHtml}
              </div>
              <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-weight: bold; font-size: 14px;">
                  ⚠️ IMPORTANTE:
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
                  <li>Los links expiran el <strong>${expirationDate}</strong></li>
                  <li>Descarga todas las fotos HOY y guárdalas en tu dispositivo</li>
                  <li>Las fotos están en alta resolución sin marca de agua</li>
                </ul>
              </div>
              <p style="margin: 24px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                ¡Gracias por confiar en nosotros!
              </p>
              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
                Saludos,<br>
                <strong style="color: #dc2626;">Equipo Diablos Rojos Foto</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Diablos Rojos Foto - Capturando momentos especiales
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

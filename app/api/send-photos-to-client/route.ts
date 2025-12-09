import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-templates';
import {
  generateDownloadLinks,
  markPhotosAsSent,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID es requerido' },
        { status: 400 }
      );
    }

    console.log('🚀 Iniciando envío de fotos para solicitud:', requestId);

    // 1. Obtener datos de la solicitud
    const requestData = await getRequestForDelivery(requestId);

    if (!requestData) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    console.log('📋 Solicitud encontrada:', {
      cliente: requestData.client_name,
      fotos: requestData.photo_ids.length,
      galeria: requestData.galleries.title,
    });

    // 2. Generar links de descarga para fotos originales
    console.log('🔗 Generando links de descarga...');
    const downloadLinks = await generateDownloadLinks(requestData.photo_ids);

    if (downloadLinks.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron generar links de descarga' },
        { status: 500 }
      );
    }

    console.log(`✅ ${downloadLinks.length} links generados`);

    // 3. Preparar email de entrega
    const emailContent = getPhotoDeliveryEmail({
      clientName: requestData.client_name,
      childName: requestData.child_name,
      galleryTitle: requestData.galleries.title,
      photoCount: downloadLinks.length,
      downloadLinks: downloadLinks.map((link) => ({
        photoId: link.photoId,
        url: link.url,
      })),
      expiresAt: downloadLinks[0].expiresAt, // Todos expiran igual
    });

    // 4. Enviar email al cliente
    console.log('📧 Enviando email al cliente:', requestData.client_email);

    await sendEmail({
      to: requestData.client_email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('✅ Email enviado exitosamente');

    // 5. Marcar solicitud como "fotos enviadas"
    await markPhotosAsSent(requestId, downloadLinks[0].expiresAt);

    console.log('✅ Solicitud marcada como fotos enviadas');

    // 6. Enviar notificación al admin (opcional)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Fotos enviadas a ${requestData.client_name}`,
          html: `
            <h2>Fotos Enviadas Exitosamente</h2>
            <p>Se han enviado las fotos a:</p>
            <ul>
              <li><strong>Cliente:</strong> ${requestData.client_name}</li>
              <li><strong>Email:</strong> ${requestData.client_email}</li>
              <li><strong>Niño/a:</strong> ${requestData.child_name}</li>
              <li><strong>Galería:</strong> ${requestData.galleries.title}</li>
              <li><strong>Fotos:</strong> ${downloadLinks.length}</li>
              <li><strong>Expiran:</strong> ${downloadLinks[0].expiresAt.toLocaleDateString('es-ES')}</li>
            </ul>
          `,
        });
      } catch (adminEmailError) {
        console.warn('⚠️ No se pudo enviar notificación al admin:', adminEmailError);
        // No fallar si este email no se envía
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fotos enviadas exitosamente',
      photosSent: downloadLinks.length,
      expiresAt: downloadLinks[0].expiresAt,
    });
  } catch (error: any) {
    console.error('❌ Error enviando fotos al cliente:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al enviar fotos',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-delivery-template';
import {
  generateDownloadLinks,
  markPhotosAsSent,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

// Endpoint para sincronizar pagos manualmente cuando el webhook no llega
export async function POST(request: NextRequest) {
  try {
    const { requestId, flowOrder } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔄 Sincronizando pago manual para:', requestId);

    // Verificar si ya fue procesado
    const { data: existingRequest } = await supabase
      .from('photo_requests')
      .select('status, photos_sent_at')
      .eq('id', requestId)
      .single();

    if (existingRequest?.photos_sent_at) {
      console.log('⚠️ Fotos ya enviadas previamente');
      return NextResponse.json({
        success: false,
        message: 'Las fotos ya fueron enviadas previamente',
      });
    }

    // Actualizar status a "paid"
    await supabase
      .from('photo_requests')
      .update({
        status: 'paid',
        flow_order: flowOrder || null,
        payment_date: new Date().toISOString(),
      })
      .eq('id', requestId);

    console.log('💾 Status actualizado a "paid"');

    // Obtener datos completos de la solicitud
    const requestData = await getRequestForDelivery(requestId);

    if (!requestData) {
      console.error('❌ Solicitud no encontrada');
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    console.log('📸 Generando links de descarga...');

    // Generar links de descarga
    const downloadLinks = await generateDownloadLinks(requestData.photo_ids);

    if (downloadLinks.length === 0) {
      console.error('❌ No se pudieron generar links');
      return NextResponse.json(
        { error: 'No se pudieron generar links de descarga' },
        { status: 500 }
      );
    }

    console.log(`✅ ${downloadLinks.length} links generados`);

    // Preparar email con las fotos
    const emailContent = getPhotoDeliveryEmail({
      clientName: requestData.client_name,
      childName: requestData.child_name,
      galleryTitle: requestData.galleries.title,
      photoCount: downloadLinks.length,
      downloadLinks: downloadLinks.map((link) => ({
        photoId: link.photoId,
        url: link.url,
      })),
      expiresAt: downloadLinks[0].expiresAt,
    });

    console.log('📧 Enviando email al cliente:', requestData.client_email);

    // Enviar email al cliente
    await sendEmail({
      to: requestData.client_email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('✅ Email enviado');

    // Marcar como fotos enviadas
    await markPhotosAsSent(requestId, downloadLinks[0].expiresAt);

    console.log('✅ Solicitud marcada como "fotos enviadas"');

    // Enviar notificación al admin (opcional)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `✅ Pago sincronizado manualmente - ${requestData.client_name}`,
          html: `
            <h2>Pago Sincronizado Manualmente</h2>
            <p>Se ha sincronizado un pago y las fotos han sido enviadas.</p>
            <ul>
              <li><strong>Cliente:</strong> ${requestData.client_name}</li>
              <li><strong>Email:</strong> ${requestData.client_email}</li>
              <li><strong>Niño/a:</strong> ${requestData.child_name}</li>
              <li><strong>Galería:</strong> ${requestData.galleries.title}</li>
              <li><strong>Fotos:</strong> ${downloadLinks.length}</li>
              <li><strong>Flow Order:</strong> ${flowOrder || 'N/A'}</li>
            </ul>
            <p><strong>Nota:</strong> Este pago fue sincronizado manualmente porque el webhook no llegó automáticamente.</p>
          `,
        });
        console.log('✅ Notificación enviada al admin');
      } catch (adminEmailError) {
        console.warn('⚠️ No se pudo enviar notificación al admin:', adminEmailError);
      }
    }

    console.log('🎉 Sincronización completada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Pago sincronizado y fotos enviadas',
      photosSent: downloadLinks.length,
      emailSentTo: requestData.client_email,
    });
  } catch (error: any) {
    console.error('❌ Error sincronizando pago:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al sincronizar pago',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

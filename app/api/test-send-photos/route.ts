import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-delivery-template';
import {
  generateDownloadLinks,
  markPhotosAsSent,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

// Endpoint de prueba para enviar fotos manualmente
export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId es requerido' },
        { status: 400 }
      );
    }

    console.log('🧪 TEST: Enviando fotos manualmente para:', requestId);

    // Obtener datos de la solicitud
    const requestData = await getRequestForDelivery(requestId);

    if (!requestData) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    console.log('📋 Solicitud encontrada:', {
      cliente: requestData.client_name,
      email: requestData.client_email,
      fotos: requestData.photo_ids.length,
    });

    // Generar links de descarga
    console.log('🔗 Generando links...');
    const downloadLinks = await generateDownloadLinks(requestData.photo_ids);

    if (downloadLinks.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron generar links' },
        { status: 500 }
      );
    }

    console.log(`✅ ${downloadLinks.length} links generados`);

    // Preparar email
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

    // Enviar email
    console.log('📧 Enviando email a:', requestData.client_email);
    await sendEmail({
      to: requestData.client_email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('✅ Email enviado');

    // Actualizar solicitud
    await supabase
      .from('photo_requests')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Marcar como enviadas
    await markPhotosAsSent(requestId, downloadLinks[0].expiresAt);

    console.log('✅ Solicitud actualizada');

    return NextResponse.json({
      success: true,
      message: 'Fotos enviadas exitosamente (test)',
      photosSent: downloadLinks.length,
      emailSentTo: requestData.client_email,
    });
  } catch (error: any) {
    console.error('❌ Error en test:', error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyFlowSignature, getFlowPaymentStatus, FLOW_STATUS } from '@/lib/flowPayment';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-delivery-template';
import {
  generateDownloadLinks,
  markPhotosAsSent,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Webhook Flow recibido');

    // Obtener parámetros del webhook
    const formData = await request.formData();
    const params: Record<string, string> = {};

    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const { token, s: signature } = params;

    if (!token || !signature) {
      console.error('❌ Token o firma faltante');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    console.log('🔐 Verificando firma...');

    // Verificar firma (seguridad)
    const paramsToVerify = { ...params };
    delete paramsToVerify.s; // No incluir la firma en la verificación

    if (!verifyFlowSignature(paramsToVerify, signature)) {
      console.error('❌ Firma inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Firma verificada');

    // Obtener estado completo del pago desde Flow
    console.log('📡 Consultando estado del pago en Flow...');
    const paymentStatus = await getFlowPaymentStatus(token);

    console.log('📊 Estado del pago:', {
      status: paymentStatus.status,
      flowOrder: paymentStatus.flowOrder,
      commerceOrder: paymentStatus.commerceOrder,
      amount: paymentStatus.amount,
    });

    // Solo procesar si el pago fue exitoso
    if (paymentStatus.status === FLOW_STATUS.PAID) {
      const requestId = paymentStatus.commerceOrder;

      console.log('✅ Pago confirmado para solicitud:', requestId);

      // Verificar si ya fue procesado (evitar duplicados)
      const { data: existingRequest } = await supabase
        .from('photo_requests')
        .select('status, photos_sent_at')
        .eq('id', requestId)
        .single();

      if (existingRequest?.photos_sent_at) {
        console.log('⚠️ Fotos ya enviadas previamente, ignorando webhook');
        return NextResponse.json({ status: 'ok', message: 'Already processed' });
      }

      // Actualizar status a "paid"
      await supabase
        .from('photo_requests')
        .update({
          status: 'paid',
          flow_order: paymentStatus.flowOrder,
          payment_date: new Date().toISOString(),
        })
        .eq('id', requestId);

      console.log('💾 Status actualizado a "paid"');

      // Obtener datos completos de la solicitud
      const requestData = await getRequestForDelivery(requestId);

      if (!requestData) {
        console.error('❌ Solicitud no encontrada');
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      console.log('📸 Generando links de descarga...');

      // Generar links de descarga
      const downloadLinks = await generateDownloadLinks(requestData.photo_ids);

      if (downloadLinks.length === 0) {
        console.error('❌ No se pudieron generar links');
        return NextResponse.json(
          { error: 'Could not generate download links' },
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
            subject: `💰 Pago recibido - ${requestData.client_name}`,
            html: `
              <h2>Pago Confirmado</h2>
              <p>Se ha recibido un pago y las fotos han sido enviadas automáticamente.</p>
              <ul>
                <li><strong>Cliente:</strong> ${requestData.client_name}</li>
                <li><strong>Email:</strong> ${requestData.client_email}</li>
                <li><strong>Niño/a:</strong> ${requestData.child_name}</li>
                <li><strong>Galería:</strong> ${requestData.galleries.title}</li>
                <li><strong>Fotos:</strong> ${downloadLinks.length}</li>
                <li><strong>Monto:</strong> $${paymentStatus.amount.toLocaleString('es-CL')}</li>
                <li><strong>Flow Order:</strong> ${paymentStatus.flowOrder}</li>
              </ul>
              <p>Las fotos fueron enviadas automáticamente al cliente.</p>
            `,
          });
          console.log('✅ Notificación enviada al admin');
        } catch (adminEmailError) {
          console.warn('⚠️ No se pudo enviar notificación al admin:', adminEmailError);
        }
      }

      console.log('🎉 Proceso completado exitosamente');

      return NextResponse.json({
        status: 'ok',
        message: 'Payment processed and photos sent',
      });
    } else {
      console.log('⚠️ Pago no completado, status:', paymentStatus.status);
      return NextResponse.json({
        status: 'ok',
        message: 'Payment not completed',
      });
    }
  } catch (error: any) {
    console.error('❌ Error procesando webhook Flow:', error);
    return NextResponse.json(
      {
        error: error.message || 'Webhook processing error',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// Flow también puede enviar GET para verificar la URL
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Flow webhook' });
}

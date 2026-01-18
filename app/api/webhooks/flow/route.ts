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
import {
  createTransactionDetails,
  getDefaultCommissionConfig,
  type CommissionConfig,
} from '@/lib/earningsCalculations';

export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    console.log('='.repeat(80));
    console.log(`🔵 [${timestamp}] Webhook Flow recibido`);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('URL:', request.url);
    console.log('Content-Type:', request.headers.get('content-type'));

    // Intentar leer como formData primero
    let params: Record<string, string> = {};

    try {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });
      console.log('✅ Leído como FormData');
    } catch (formError) {
      console.log('⚠️ No es FormData, intentando JSON...');
      try {
        const body = await request.json();
        params = body;
        console.log('✅ Leído como JSON');
      } catch (jsonError) {
        console.log('⚠️ No es JSON, intentando text...');
        const text = await request.text();
        console.log('Body raw:', text);

        // Parsear manualmente si es URL encoded
        if (text) {
          const urlParams = new URLSearchParams(text);
          urlParams.forEach((value, key) => {
            params[key] = value;
          });
        }
      }
    }

    console.log('Parámetros recibidos:', Object.keys(params));
    console.log('Parámetros completos:', JSON.stringify(params, null, 2));

    const { token, s: signature } = params;

    // Validar que el token esté presente (obligatorio)
    if (!token) {
      console.error('❌ Token faltante');
      return NextResponse.json({
        error: 'Token is required',
        debug: {
          hasToken: false,
          receivedKeys: Object.keys(params)
        }
      }, { status: 400 });
    }

    console.log('✅ Token presente:', token);

    // Verificar firma SI está presente (opcional temporalmente)
    if (signature) {
      console.log('🔐 Firma presente, verificando...');

      const paramsToVerify = { ...params };
      delete paramsToVerify.s; // No incluir la firma en la verificación

      if (!verifyFlowSignature(paramsToVerify, signature)) {
        console.error('❌ Firma inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      console.log('✅ Firma verificada correctamente');
    } else {
      console.warn('⚠️ Firma no enviada por Flow - continuando sin validación de firma');
      console.warn('⚠️ TEMPORAL: En producción la firma debería ser obligatoria');
    }

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
        .select('status, photos_sent_at, gallery_id, photo_ids')
        .eq('id', requestId)
        .single();

      if (existingRequest?.photos_sent_at) {
        console.log('⚠️ Fotos ya enviadas previamente, ignorando webhook');
        return NextResponse.json({ status: 'ok', message: 'Already processed' });
      }

      // Obtener configuración de comisiones de la galería
      console.log('📊 Obteniendo configuración de comisiones...');
      const { data: gallery } = await supabase
        .from('galleries')
        .select('commission_config')
        .eq('id', existingRequest.gallery_id)
        .single();

      // Usar config de la galería o defaults
      let commissionConfig: CommissionConfig = getDefaultCommissionConfig();
      if (gallery?.commission_config) {
        commissionConfig = {
          ...commissionConfig,
          ...gallery.commission_config,
        };
      }

      console.log('💰 Configuración de comisiones:', commissionConfig);

      // Obtener precio por foto actual
      const pricePerPhoto = parseInt(process.env.PRICE_PER_PHOTO || '2000');
      const photoCount = existingRequest.photo_ids?.length || 0;

      // Extraer comisión real de Flow si está disponible
      // Flow devuelve: amount (monto total), balance (neto que recibes), fee (comisión)
      let gatewayFee: number | null = null;
      if (paymentStatus.fee !== undefined && paymentStatus.fee !== null) {
        gatewayFee = paymentStatus.fee;
        console.log('✅ Comisión real de Flow capturada:', gatewayFee);
      } else {
        console.log('⚠️ Comisión de Flow no disponible, se estimará');
      }

      // Calcular distribución de ganancias
      const transactionDetails = createTransactionDetails(
        photoCount,
        pricePerPhoto,
        gatewayFee,
        commissionConfig,
        paymentStatus.flowOrder
      );

      console.log('💵 Desglose de ganancias:', {
        gross: transactionDetails.gross_amount,
        gateway_fee: transactionDetails.gateway_fee,
        net: transactionDetails.net_amount,
        photographer: transactionDetails.photographer_share,
        director: transactionDetails.director_share,
      });

      // Actualizar status a "paid" y guardar transaction_details
      await supabase
        .from('photo_requests')
        .update({
          status: 'paid',
          flow_order: paymentStatus.flowOrder,
          payment_date: new Date().toISOString(),
          price_per_photo: pricePerPhoto,
          transaction_details: transactionDetails,
          settlement_status: 'pending',
        })
        .eq('id', requestId);

      console.log('💾 Status actualizado a "paid" con transaction_details');

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

              <h3>Información del Cliente</h3>
              <ul>
                <li><strong>Cliente:</strong> ${requestData.client_name}</li>
                <li><strong>Email:</strong> ${requestData.client_email}</li>
                <li><strong>Niño/a:</strong> ${requestData.child_name}</li>
                <li><strong>Galería:</strong> ${requestData.galleries.title}</li>
                <li><strong>Fotos:</strong> ${downloadLinks.length}</li>
              </ul>

              <h3>Desglose Financiero</h3>
              <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Monto Total:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
                    $${transactionDetails.gross_amount.toLocaleString('es-CL')}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    Comisión Flow ${transactionDetails.gateway_fee_estimated ? '(estimada)' : ''}:
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #dc2626;">
                    -$${transactionDetails.gateway_fee.toLocaleString('es-CL')}
                  </td>
                </tr>
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Monto Neto:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
                    <strong>$${transactionDetails.net_amount.toLocaleString('es-CL')}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    Fotógrafo (${transactionDetails.photographer_percentage}%):
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #16a34a;">
                    $${transactionDetails.photographer_share.toLocaleString('es-CL')}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    Director (${transactionDetails.director_percentage}%):
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #2563eb;">
                    $${transactionDetails.director_share.toLocaleString('es-CL')}
                  </td>
                </tr>
              </table>

              <p style="margin-top: 20px; padding: 10px; background-color: #ecfdf5; border-left: 4px solid #10b981;">
                <strong>✅ Las fotos fueron enviadas automáticamente al cliente.</strong>
              </p>

              <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Flow Order: ${paymentStatus.flowOrder} | Solicitud ID: ${requestId}
              </p>
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
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('='.repeat(80));
  console.log(`🟢 [${timestamp}] GET request a webhook Flow`);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  console.log('URL:', request.url);
  console.log('='.repeat(80));

  return NextResponse.json({
    status: 'ok',
    service: 'Flow webhook',
    timestamp,
    ready: true
  });
}

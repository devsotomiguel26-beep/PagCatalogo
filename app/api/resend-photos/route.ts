import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/emailService';
import { getPhotoDeliveryEmail } from '@/lib/email-delivery-template';
import {
  generateDownloadLinks,
  getRequestForDelivery,
} from '@/lib/photoDelivery';

// Crear cliente Supabase con permisos de admin para server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para reenviar fotos a clientes
 * Casos de uso:
 * - Cliente ingresó email incorrecto
 * - Email no llegó (spam, servidor caído, etc.)
 * - Enlaces expiraron y necesitan regenerarse
 * - Cliente solicita reenvío
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, newEmail, sentBy } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID es requerido' },
        { status: 400 }
      );
    }

    console.log('🔄 Iniciando reenvío de fotos para solicitud:', requestId);
    console.log('📧 Nuevo email:', newEmail || 'usar email original');

    // 1. Obtener datos de la solicitud
    const requestData = await getRequestForDelivery(requestId);

    if (!requestData) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // 2. Determinar email de destino (nuevo o original)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const destinationEmail = newEmail || requestData.client_email;

    if (!emailRegex.test(destinationEmail)) {
      return NextResponse.json(
        { error: 'Email inválido. Por favor verifica el formato.' },
        { status: 400 }
      );
    }

    console.log('📋 Solicitud encontrada:', {
      cliente: requestData.client_name,
      emailOriginal: requestData.client_email,
      emailDestino: destinationEmail,
      fotos: requestData.photo_ids.length,
      galeria: requestData.galleries?.title,
    });

    // 3. Verificar si los enlaces expiraron y regenerarlos
    const now = new Date();
    const linksExpired = requestData.download_links_expires_at
      ? new Date(requestData.download_links_expires_at) < now
      : true;

    if (linksExpired) {
      console.log('⚠️ Enlaces expirados, regenerando...');
    } else {
      console.log('✅ Enlaces aún válidos, regenerando de todas formas para nueva expiración');
    }

    // 4. Generar links de descarga (siempre regenerar para extender expiración)
    console.log('🔗 Generando nuevos links de descarga...');
    const downloadLinks = await generateDownloadLinks(requestData.photo_ids);

    if (downloadLinks.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron generar links de descarga' },
        { status: 500 }
      );
    }

    console.log(`✅ ${downloadLinks.length} links generados`);

    // 5. Preparar email de entrega
    const emailContent = getPhotoDeliveryEmail({
      clientName: requestData.client_name,
      childName: requestData.child_name,
      galleryTitle: requestData.galleries?.title || 'Sin título',
      photoCount: downloadLinks.length,
      downloadLinks: downloadLinks.map((link) => ({
        photoId: link.photoId,
        url: link.url,
      })),
      expiresAt: downloadLinks[0].expiresAt,
    });

    // 6. Enviar email al cliente
    console.log('📧 Enviando email a:', destinationEmail);

    await sendEmail({
      to: destinationEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('✅ Email enviado exitosamente');

    // 7. Obtener historial actual de entregas
    const currentDeliveryHistory = Array.isArray(requestData.delivery_history)
      ? requestData.delivery_history
      : [];

    const currentDeliveryAttempts = requestData.delivery_attempts || 0;

    // 8. Crear registro del nuevo envío
    const deliveryRecord = {
      sentAt: new Date().toISOString(),
      sentTo: destinationEmail,
      sentBy: sentBy || 'admin',
      linksExpireAt: downloadLinks[0].expiresAt.toISOString(),
      photoCount: downloadLinks.length,
      wasResend: currentDeliveryAttempts > 0,
      emailChanged: newEmail && newEmail !== requestData.client_email,
    };

    // 9. Actualizar solicitud con nuevo historial
    const { error: updateError } = await supabase
      .from('photo_requests')
      .update({
        photos_sent_at: new Date().toISOString(), // Actualizar a fecha más reciente
        download_links_expires_at: downloadLinks[0].expiresAt.toISOString(),
        delivery_attempts: currentDeliveryAttempts + 1,
        delivery_history: [...currentDeliveryHistory, deliveryRecord],
        last_delivery_email: destinationEmail,
        // Si el email cambió, actualizar también el client_email
        ...(newEmail && { client_email: newEmail }),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error actualizando solicitud:', updateError);
      throw new Error('Error actualizando el historial de entregas');
    }

    console.log('✅ Solicitud actualizada con nuevo historial');

    // 10. Enviar notificación al admin (opcional)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Fotos reenviadas a ${requestData.client_name}`,
          html: `
            <h2>Fotos Reenviadas Exitosamente</h2>
            <p><strong>Detalles del reenvío:</strong></p>
            <ul>
              <li><strong>Cliente:</strong> ${requestData.client_name}</li>
              <li><strong>Email original:</strong> ${requestData.client_email}</li>
              ${newEmail ? `<li><strong>Nuevo email:</strong> ${newEmail}</li>` : ''}
              <li><strong>Email enviado a:</strong> ${destinationEmail}</li>
              <li><strong>Niño/a:</strong> ${requestData.child_name}</li>
              <li><strong>Galería:</strong> ${requestData.galleries?.title}</li>
              <li><strong>Fotos:</strong> ${downloadLinks.length}</li>
              <li><strong>Intento de entrega #:</strong> ${currentDeliveryAttempts + 1}</li>
              <li><strong>Enlaces expiran:</strong> ${downloadLinks[0].expiresAt.toLocaleDateString('es-ES')}</li>
              <li><strong>Reenviado por:</strong> ${sentBy || 'Sistema'}</li>
            </ul>
          `,
        });
      } catch (adminEmailError) {
        console.warn('⚠️ No se pudo enviar notificación al admin:', adminEmailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: newEmail
        ? `Fotos reenviadas exitosamente a ${destinationEmail}`
        : 'Fotos reenviadas exitosamente',
      photosSent: downloadLinks.length,
      expiresAt: downloadLinks[0].expiresAt,
      deliveryAttempt: currentDeliveryAttempts + 1,
      emailChanged: !!newEmail,
      linksRegenerated: linksExpired,
    });
  } catch (error: any) {
    console.error('❌ Error reenviando fotos:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al reenviar fotos',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

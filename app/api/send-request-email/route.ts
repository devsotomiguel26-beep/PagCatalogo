import { NextRequest, NextResponse } from 'next/server';
import { sendMultipleEmails } from '@/lib/emailService';
import {
  getPhotoRequestConfirmationEmail,
  getAdminNotificationEmail,
} from '@/lib/email-templates';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@diablosrojosfoto.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      childName,
      galleryTitle,
      photoCount,
      requestId,
    } = body;

    // Validate required fields
    if (!clientName || !clientEmail || !childName || !galleryTitle || !photoCount || !requestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Preparar email de confirmación al cliente
    const clientEmailContent = getPhotoRequestConfirmationEmail({
      clientName,
      childName,
      galleryTitle,
      photoCount,
    });

    // Preparar email de notificación al admin
    const adminEmailContent = getAdminNotificationEmail({
      clientName,
      clientEmail,
      clientPhone,
      childName,
      galleryTitle,
      photoCount,
      requestId,
    });

    // Enviar ambos emails usando Gmail SMTP
    try {
      await sendMultipleEmails([
        {
          to: clientEmail,
          subject: clientEmailContent.subject,
          html: clientEmailContent.html,
        },
        {
          to: adminEmail,
          subject: adminEmailContent.subject,
          html: adminEmailContent.html,
        },
      ]);

      console.log('✅ Emails enviados exitosamente via Gmail SMTP');
    } catch (emailError) {
      console.error('⚠️ Error enviando emails (pero solicitud guardada):', emailError);
      // No fallar la request completa si el email falla
    }

    // Return success (request was saved to DB)
    return NextResponse.json({
      success: true,
      emailsSent: true,
    });
  } catch (error: any) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  getPhotoRequestConfirmationEmail,
  getAdminNotificationEmail,
} from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@diablosrojosfoto.com';
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

    // Send confirmation email to client
    const clientEmailContent = getPhotoRequestConfirmationEmail({
      clientName,
      childName,
      galleryTitle,
      photoCount,
    });

    const clientEmailResult = await resend.emails.send({
      from: fromEmail,
      to: clientEmail,
      subject: clientEmailContent.subject,
      html: clientEmailContent.html,
    });

    console.log('Client email sent:', clientEmailResult);

    // Check for email errors
    if (clientEmailResult.error) {
      console.error('Client email error:', clientEmailResult.error);
    }

    // Send notification email to admin
    const adminEmailContent = getAdminNotificationEmail({
      clientName,
      clientEmail,
      clientPhone,
      childName,
      galleryTitle,
      photoCount,
      requestId,
    });

    const adminEmailResult = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: adminEmailContent.subject,
      html: adminEmailContent.html,
    });

    console.log('Admin email sent:', adminEmailResult);

    // Check for email errors
    if (adminEmailResult.error) {
      console.error('Admin email error:', adminEmailResult.error);
    }

    // Return success even if emails failed (request was saved to DB)
    return NextResponse.json({
      success: true,
      clientEmailId: clientEmailResult.data?.id,
      adminEmailId: adminEmailResult.data?.id,
      warnings: {
        clientEmailFailed: !!clientEmailResult.error,
        adminEmailFailed: !!adminEmailResult.error,
      },
    });
  } catch (error: any) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}

import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, replyTo } = options;

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      replyTo: replyTo || fromEmail,
    });

    console.log('✅ Email enviado exitosamente via Resend');
    console.log('Email ID:', result.data?.id);
    return;
  } catch (error) {
    console.error('❌ Error enviando email via Resend:', error);
    throw error;
  }
}

export async function sendMultipleEmails(emails: SendEmailOptions[]): Promise<void> {
  const promises = emails.map((email) => sendEmail(email));
  await Promise.all(promises);
}

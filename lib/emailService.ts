import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Error en configuración de Gmail SMTP:', error);
  } else {
    console.log('✅ Gmail SMTP configurado correctamente y listo para enviar emails');
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, replyTo } = options;

  try {
    const info = await transporter.sendMail({
      from: `Diablos Rojos Foto <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      replyTo: replyTo || process.env.GMAIL_USER,
    });

    console.log('✅ Email enviado exitosamente via Gmail SMTP');
    return info;
  } catch (error) {
    console.error('❌ Error enviando email via Gmail SMTP:', error);
    throw error;
  }
}

export async function sendMultipleEmails(emails: SendEmailOptions[]): Promise<void> {
  const promises = emails.map((email) => sendEmail(email));
  await Promise.all(promises);
}

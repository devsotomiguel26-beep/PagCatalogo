// Dynamic import of nodemailer for serverless compatibility
function getTransporter() {
  const nodemailer = require('nodemailer');

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, replyTo } = options;

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
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

import nodemailer from 'nodemailer';

// Configurar transporter con Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verificar configuración al inicio
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

/**
 * Envía un email usando Gmail SMTP
 * @param options Opciones del email (to, subject, html, replyTo)
 * @returns Promise con el resultado del envío
 */
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
    console.log('   Destinatario:', to);
    console.log('   Message ID:', info.messageId);
    console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));

    return info;
  } catch (error) {
    console.error('❌ Error enviando email via Gmail SMTP:', error);
    throw error;
  }
}

/**
 * Envía múltiples emails (útil para enviar a admin y cliente)
 * @param emails Array de opciones de emails
 */
export async function sendMultipleEmails(
  emails: SendEmailOptions[]
): Promise<void> {
  try {
    const promises = emails.map((email) => sendEmail(email));
    await Promise.all(promises);
    console.log(`✅ ${emails.length} emails enviados exitosamente`);
  } catch (error) {
    console.error('❌ Error enviando emails múltiples:', error);
    throw error;
  }
}

export default {
  sendEmail,
  sendMultipleEmails,
};

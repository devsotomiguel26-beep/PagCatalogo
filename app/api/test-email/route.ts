import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

/**
 * Endpoint de prueba para verificar configuración de Resend
 * Envía un email de prueba simple
 */
export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email destinatario es requerido' },
        { status: 400 }
      );
    }

    console.log('📧 Enviando email de prueba a:', to);

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Email de Prueba</h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #dc2626;">¡Resend está funcionando correctamente!</h2>

            <p>Este es un email de prueba para verificar que tu configuración de Resend está funcionando.</p>

            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #166534;">✅ Configuración exitosa</p>
              <p style="margin: 8px 0 0 0; color: #166534;">Tu sistema de emails está listo para enviar fotos a tus clientes.</p>
            </div>

            <h3 style="color: #374151; margin-top: 24px;">Detalles de la prueba:</h3>
            <ul style="color: #6b7280;">
              <li><strong>Servicio:</strong> Resend</li>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</li>
              <li><strong>Estado:</strong> Entregado exitosamente</li>
            </ul>

            <p style="margin-top: 24px;">Si recibiste este email, significa que:</p>
            <ul style="color: #6b7280;">
              <li>✅ La API key de Resend está configurada correctamente</li>
              <li>✅ El servicio de email funciona en producción</li>
              <li>✅ Los emails están siendo entregados</li>
              <li>✅ Estás listo para enviar fotos a clientes</li>
            </ul>

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">🔥 Diablos Rojos Foto</p>
              <p style="margin: 8px 0 0 0; color: #991b1b;">Sistema de entrega de fotos automático funcionando correctamente.</p>
            </div>

            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              Este es un email de prueba generado automáticamente.<br>
              Si recibiste este email por error, puedes ignorarlo.
            </p>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to,
      subject: '✅ Prueba de Email - Resend configurado correctamente',
      html: testHtml,
    });

    console.log('✅ Email de prueba enviado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Email de prueba enviado exitosamente',
      sentTo: to,
      timestamp: new Date().toISOString(),
      provider: 'Resend',
      tip: 'Revisa tu bandeja de entrada (y spam si no lo ves)',
    });
  } catch (error: any) {
    console.error('❌ Error enviando email de prueba:', error);

    // Detectar errores comunes de Resend
    let errorMessage = error.message || 'Error al enviar email de prueba';
    let suggestion = '';

    if (error.message?.includes('Missing API key')) {
      suggestion = 'Verifica que RESEND_API_KEY esté configurada en Vercel';
    } else if (error.message?.includes('Invalid from address')) {
      suggestion = 'Verifica que RESEND_FROM_EMAIL esté configurada correctamente';
    } else if (error.message?.includes('401')) {
      suggestion = 'La API key de Resend es inválida. Verifica que la copiaste correctamente';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        suggestion,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// GET para mostrar instrucciones
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de prueba de email',
    usage: 'POST con { "to": "tu-email@ejemplo.com" }',
    example: `
      curl -X POST https://fotos.diablosrojoscl.com/api/test-email \\
        -H "Content-Type: application/json" \\
        -d '{"to": "tu-email@ejemplo.com"}'
    `,
    config: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Configurada ✓' : 'NO configurada ✗',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NO configurada ✗',
    },
  });
}

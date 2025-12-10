import { NextRequest, NextResponse } from 'next/server';
import { getFlowPaymentStatus, FLOW_STATUS } from '@/lib/flowPayment';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Flow puede enviar GET o POST al urlReturn
export async function GET(request: NextRequest) {
  return handleReturn(request);
}

export async function POST(request: NextRequest) {
  return handleReturn(request);
}

async function handleReturn(request: NextRequest) {
  try {
    // Obtener token de la URL o del body
    let token: string | null = null;

    if (request.method === 'GET') {
      token = request.nextUrl.searchParams.get('token');
    } else {
      // POST - leer del body
      const formData = await request.formData();
      token = formData.get('token')?.toString() || null;
    }

    console.log('🔙 Return de Flow recibido, token:', token);

    if (!token) {
      console.error('❌ No se recibió token en el return');
      return createRedirectResponse(`${APP_URL}/pago/fallido`);
    }

    // Verificar el estado del pago
    const paymentStatus = await getFlowPaymentStatus(token);

    console.log('📊 Estado del pago en return:', {
      status: paymentStatus.status,
      flowOrder: paymentStatus.flowOrder,
    });

    // Determinar URL de redirección según el estado
    let redirectUrl: string;

    if (paymentStatus.status === FLOW_STATUS.PAID) {
      redirectUrl = `${APP_URL}/pago/exitoso`;
    } else if (paymentStatus.status === FLOW_STATUS.REJECTED) {
      redirectUrl = `${APP_URL}/pago/fallido`;
    } else if (paymentStatus.status === FLOW_STATUS.CANCELLED) {
      redirectUrl = `${APP_URL}/pago/fallido`;
    } else {
      // Pendiente u otro estado
      redirectUrl = `${APP_URL}/pago/resultado?token=${token}`;
    }

    return createRedirectResponse(redirectUrl);
  } catch (error: any) {
    console.error('❌ Error procesando return de Flow:', error);
    return createRedirectResponse(`${APP_URL}/pago/fallido`);
  }
}

// Crear respuesta HTML con redirect automático (funciona con POST y GET)
function createRedirectResponse(url: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="0;url=${url}">
        <title>Procesando pago...</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          }
          .container {
            text-align: center;
            color: white;
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
            font-weight: 600;
          }
          p {
            font-size: 16px;
            margin: 0;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>Procesando tu pago...</h1>
          <p>Serás redirigido en un momento</p>
        </div>
        <script>
          // Fallback si meta refresh no funciona
          setTimeout(function() {
            window.location.href = '${url}';
          }, 100);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

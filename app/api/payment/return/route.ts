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
      return NextResponse.redirect(`${APP_URL}/pago/fallido`);
    }

    // Verificar el estado del pago
    const paymentStatus = await getFlowPaymentStatus(token);

    console.log('📊 Estado del pago en return:', {
      status: paymentStatus.status,
      flowOrder: paymentStatus.flowOrder,
    });

    // Redirigir según el estado
    if (paymentStatus.status === FLOW_STATUS.PAID) {
      return NextResponse.redirect(`${APP_URL}/pago/exitoso`);
    } else if (paymentStatus.status === FLOW_STATUS.REJECTED) {
      return NextResponse.redirect(`${APP_URL}/pago/fallido`);
    } else if (paymentStatus.status === FLOW_STATUS.CANCELLED) {
      return NextResponse.redirect(`${APP_URL}/pago/fallido`);
    } else {
      // Pendiente u otro estado
      return NextResponse.redirect(`${APP_URL}/pago/resultado?token=${token}`);
    }
  } catch (error: any) {
    console.error('❌ Error procesando return de Flow:', error);
    return NextResponse.redirect(`${APP_URL}/pago/fallido`);
  }
}

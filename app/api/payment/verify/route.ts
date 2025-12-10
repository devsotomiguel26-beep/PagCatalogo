import { NextRequest, NextResponse } from 'next/server';
import { getFlowPaymentStatus, FLOW_STATUS } from '@/lib/flowPayment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando estado de pago con token:', token);

    // Obtener estado del pago desde Flow
    const paymentStatus = await getFlowPaymentStatus(token);

    console.log('📊 Estado del pago:', {
      status: paymentStatus.status,
      flowOrder: paymentStatus.flowOrder,
      commerceOrder: paymentStatus.commerceOrder,
    });

    // Retornar el estado
    return NextResponse.json({
      status: paymentStatus.status === FLOW_STATUS.PAID ? 'paid' : 'pending',
      flowOrder: paymentStatus.flowOrder,
      commerceOrder: paymentStatus.commerceOrder,
      amount: paymentStatus.amount,
    });
  } catch (error: any) {
    console.error('❌ Error verificando pago:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al verificar pago',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

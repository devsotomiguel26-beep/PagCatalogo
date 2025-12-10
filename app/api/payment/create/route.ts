import { NextRequest, NextResponse } from 'next/server';
import { createFlowPayment } from '@/lib/flowPayment';
import { supabase } from '@/lib/supabaseClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PRICE_PER_PHOTO = 2000; // $2000 CLP por foto

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔵 Creando pago Flow para solicitud:', requestId);

    // Obtener datos de la solicitud
    const { data: photoRequest, error } = await supabase
      .from('photo_requests')
      .select(`
        id,
        client_name,
        client_email,
        child_name,
        photo_ids,
        galleries (
          title
        )
      `)
      .eq('id', requestId)
      .single();

    if (error || !photoRequest) {
      console.error('Error obteniendo solicitud:', error);
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Calcular monto
    const photoCount = photoRequest.photo_ids.length;
    const amount = photoCount * PRICE_PER_PHOTO;

    console.log('📸 Fotos:', photoCount, '| Monto:', amount);

    // Crear pago en Flow
    const flowPayment = await createFlowPayment({
      commerceOrder: requestId,
      subject: `Fotos ${photoRequest.child_name} - ${photoRequest.galleries.title}`,
      amount: amount,
      email: photoRequest.client_email,
      urlConfirmation: `${APP_URL}/api/webhooks/flow`,
      urlReturn: `${APP_URL}/api/payment/return`,
    });

    console.log('✅ Pago Flow creado:', flowPayment.flowOrder);

    // Guardar flowOrder en la solicitud
    await supabase
      .from('photo_requests')
      .update({ flow_order: flowPayment.flowOrder })
      .eq('id', requestId);

    // Retornar URL de pago
    return NextResponse.json({
      success: true,
      paymentUrl: `${flowPayment.url}?token=${flowPayment.token}`,
      flowOrder: flowPayment.flowOrder,
      amount: amount,
    });
  } catch (error: any) {
    console.error('❌ Error creando pago Flow:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al crear pago',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

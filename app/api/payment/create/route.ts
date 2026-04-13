import { NextRequest, NextResponse } from 'next/server';
import { createFlowPayment } from '@/lib/flowPayment';
import { supabase } from '@/lib/supabaseClient';
import { calculatePrice } from '@/lib/pricingTiers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        gallery_title,
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

    // Si la galería fue eliminada, usar el título desnormalizado
    const galleryTitle = photoRequest.galleries?.title || photoRequest.gallery_title || 'Galería';

    // Calcular precio con sistema de tiers
    const photoCount = photoRequest.photo_ids.length;
    const pricing = await calculatePrice(photoCount);

    console.log('📸 Fotos:', photoCount);
    console.log('💰 Pricing:', {
      tier: pricing.tierName,
      basePrice: pricing.basePrice,
      effectivePrice: pricing.effectivePrice,
      discount: pricing.discountPercentage + '%',
      total: pricing.totalPrice,
    });

    // Crear pago en Flow con precio efectivo (con descuento aplicado)
    const flowPayment = await createFlowPayment({
      commerceOrder: requestId,
      subject: `Fotos ${photoRequest.child_name} - ${galleryTitle}`,
      amount: pricing.totalPrice,
      email: photoRequest.client_email,
      urlConfirmation: `${APP_URL}/api/webhooks/flow`,
      urlReturn: `${APP_URL}/api/payment/return`,
    });

    console.log('✅ Pago Flow creado:', flowPayment.flowOrder);

    // Guardar flowOrder y datos de pricing en la solicitud
    await supabase
      .from('photo_requests')
      .update({
        flow_order: flowPayment.flowOrder,
        base_price_per_photo: pricing.basePrice,
        price_per_photo: pricing.effectivePrice,
        discount_amount: pricing.discountAmount,
        discount_percentage: pricing.discountPercentage,
        tier_name: pricing.tierName,
      })
      .eq('id', requestId);

    // Retornar URL de pago
    return NextResponse.json({
      success: true,
      paymentUrl: `${flowPayment.url}?token=${flowPayment.token}`,
      flowOrder: flowPayment.flowOrder,
      amount: pricing.totalPrice,
      pricing: {
        photoCount: pricing.photoCount,
        tierName: pricing.tierName,
        discountPercentage: pricing.discountPercentage,
        discountAmount: pricing.discountAmount,
        baseTotal: pricing.baseTotalPrice,
        total: pricing.totalPrice,
      },
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

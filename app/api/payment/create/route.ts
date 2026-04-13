import { NextRequest, NextResponse } from 'next/server';
import { createFlowPayment } from '@/lib/flowPayment';
import { supabase } from '@/lib/supabaseClient';
import { calculatePriceWithPromotions } from '@/lib/pricingTiers';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Service role client para actualizar usos de promociones
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, promoCode, promoCodeId, promoPromotion } = body;

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
        gallery_id,
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

    // Calcular precio con tiers + promociones
    const photoCount = photoRequest.photo_ids.length;
    const pricing = await calculatePriceWithPromotions(
      photoCount,
      photoRequest.gallery_id,
      promoCode,
      promoCodeId,
      promoPromotion,
    );

    console.log('📸 Fotos:', photoCount);
    console.log('💰 Pricing:', {
      tier: pricing.tierName,
      basePrice: pricing.basePrice,
      effectivePrice: pricing.effectivePrice,
      discount: pricing.discountPercentage + '%',
      total: pricing.totalPrice,
      promotion: pricing.promotion?.name || 'ninguna',
    });

    // Crear pago en Flow con precio efectivo (con descuentos aplicados)
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
    const updateData: Record<string, any> = {
      flow_order: flowPayment.flowOrder,
      base_price_per_photo: pricing.basePrice,
      price_per_photo: pricing.effectivePrice,
      discount_amount: pricing.discountAmount,
      discount_percentage: pricing.discountPercentage,
      tier_name: pricing.tierName,
    };

    // Guardar datos de promoción si aplica
    if (pricing.promotion) {
      updateData.promotion_id = pricing.promotion.id;
      updateData.promotion_name = pricing.promotion.name;
      updateData.promotion_discount_amount = pricing.promotion.discountAmount;
      if (pricing.promotion.promoCodeId) {
        updateData.promo_code_id = pricing.promotion.promoCodeId;
      }
    }

    await supabase
      .from('photo_requests')
      .update(updateData)
      .eq('id', requestId);

    // Incrementar contadores de uso de promoción y código
    if (pricing.promotion) {
      await supabaseAdmin
        .from('promotions')
        .update({ current_uses: supabaseAdmin.rpc ? undefined : 0 })
        .eq('id', pricing.promotion.id);

      // Incrementar current_uses atómicamente via RPC o update directo
      await supabaseAdmin.rpc('increment_promotion_uses', { promo_id: pricing.promotion.id }).catch(() => {
        // Fallback: update directo (no atómico pero funcional)
        supabaseAdmin
          .from('promotions')
          .select('current_uses')
          .eq('id', pricing.promotion!.id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabaseAdmin
                .from('promotions')
                .update({ current_uses: data.current_uses + 1 })
                .eq('id', pricing.promotion!.id);
            }
          });
      });

      if (pricing.promotion.promoCodeId) {
        await supabaseAdmin.rpc('increment_promo_code_uses', { code_id: pricing.promotion.promoCodeId }).catch(() => {
          supabaseAdmin
            .from('promo_codes')
            .select('current_uses')
            .eq('id', pricing.promotion!.promoCodeId!)
            .single()
            .then(({ data }) => {
              if (data) {
                supabaseAdmin
                  .from('promo_codes')
                  .update({ current_uses: data.current_uses + 1 })
                  .eq('id', pricing.promotion!.promoCodeId!);
              }
            });
        });
      }

      // Registrar uso en tabla de auditoría
      await supabaseAdmin.from('promotion_usage').insert([{
        promotion_id: pricing.promotion.id,
        promo_code_id: pricing.promotion.promoCodeId || null,
        photo_request_id: requestId,
        discount_applied: pricing.promotion.discountAmount,
      }]);
    }

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
        promotion: pricing.promotion ? {
          name: pricing.promotion.name,
          discountAmount: pricing.promotion.discountAmount,
        } : null,
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

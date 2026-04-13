import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, calculatePriceWithPromotions, getNextTier } from '@/lib/pricingTiers';

/**
 * POST /api/pricing/calculate
 * Calcula el precio total y descuentos para una cantidad de fotos
 *
 * Body: { photo_count: number, gallery_id?: string, promo_code?: string, promo_code_id?: string, promo_promotion?: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_count, gallery_id, promo_code, promo_code_id, promo_promotion } = body;

    if (!photo_count || photo_count < 1) {
      return NextResponse.json(
        { error: 'photo_count debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    // Si hay contexto de galería o código promo, usar cálculo con promociones
    const hasPromoContext = gallery_id || promo_code || promo_code_id;

    const pricing = hasPromoContext
      ? await calculatePriceWithPromotions(photo_count, gallery_id, promo_code, promo_code_id, promo_promotion)
      : await calculatePrice(photo_count);

    const nextTier = await getNextTier(photo_count);

    return NextResponse.json({
      ...pricing,
      nextTier,
    });
  } catch (error: any) {
    console.error('❌ Error calculando precio:', error);
    return NextResponse.json(
      { error: error.message || 'Error calculando precio' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pricing/calculate?photo_count=7&gallery_id=xxx
 * Alternativa GET para calcular precio
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoCountStr = searchParams.get('photo_count');
    const galleryId = searchParams.get('gallery_id') || undefined;

    if (!photoCountStr) {
      return NextResponse.json(
        { error: 'photo_count es requerido' },
        { status: 400 }
      );
    }

    const photo_count = parseInt(photoCountStr);

    if (isNaN(photo_count) || photo_count < 1) {
      return NextResponse.json(
        { error: 'photo_count debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    const pricing = galleryId
      ? await calculatePriceWithPromotions(photo_count, galleryId)
      : await calculatePrice(photo_count);

    const nextTier = await getNextTier(photo_count);

    return NextResponse.json({
      ...pricing,
      nextTier,
    });
  } catch (error: any) {
    console.error('❌ Error calculando precio:', error);
    return NextResponse.json(
      { error: error.message || 'Error calculando precio' },
      { status: 500 }
    );
  }
}

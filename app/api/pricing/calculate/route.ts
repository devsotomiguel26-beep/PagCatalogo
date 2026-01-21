import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, getNextTier } from '@/lib/pricingTiers';

/**
 * POST /api/pricing/calculate
 * Calcula el precio total y descuentos para una cantidad de fotos
 *
 * Body: { photo_count: number }
 *
 * Returns:
 * {
 *   photoCount: number,
 *   basePrice: number,
 *   effectivePrice: number,
 *   totalPrice: number,
 *   baseTotalPrice: number,
 *   discountAmount: number,
 *   discountPercentage: number,
 *   tierName: string,
 *   nextTier: { ... } | null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_count } = body;

    // Validar que photo_count esté presente y sea válido
    if (!photo_count || photo_count < 1) {
      return NextResponse.json(
        { error: 'photo_count debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    // Calcular precio
    const pricing = calculatePrice(photo_count);

    // Obtener información del siguiente tier
    const nextTier = getNextTier(photo_count);

    return NextResponse.json({
      ...pricing,
      nextTier,
    });
  } catch (error: any) {
    console.error('❌ Error calculando precio:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error calculando precio',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pricing/calculate?photo_count=7
 * Alternativa GET para calcular precio
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoCountStr = searchParams.get('photo_count');

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

    const pricing = calculatePrice(photo_count);
    const nextTier = getNextTier(photo_count);

    return NextResponse.json({
      ...pricing,
      nextTier,
    });
  } catch (error: any) {
    console.error('❌ Error calculando precio:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error calculando precio',
      },
      { status: 500 }
    );
  }
}

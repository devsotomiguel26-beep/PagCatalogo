import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * POST /api/pricing/validate-code
 * Valida un código promocional y retorna preview del descuento
 *
 * Body: { code: string, gallery_id?: string, photo_count?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, gallery_id, photo_count } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { valid: false, error: 'El código es requerido' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Buscar el código
    const { data: promoCode, error: codeError } = await supabase
      .from('promo_codes')
      .select(`
        id, code, max_uses, current_uses, is_active,
        promotion:promotions!promo_codes_promotion_id_fkey (
          id, name, description, type, is_active,
          discount_percentage, discount_amount, fixed_price_per_photo,
          scope, scope_gallery_id, scope_category_id, scope_event_type,
          min_photos, max_uses, current_uses,
          starts_at, ends_at
        )
      `)
      .ilike('code', normalizedCode)
      .single();

    if (codeError || !promoCode) {
      return NextResponse.json({
        valid: false,
        error: 'Código no encontrado',
      });
    }

    // Validar que el código esté activo
    if (!promoCode.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'Este código ya no está disponible',
      });
    }

    // Validar usos del código
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'Este código ha alcanzado el límite de usos',
      });
    }

    const promotion = promoCode.promotion as any;
    if (!promotion) {
      return NextResponse.json({
        valid: false,
        error: 'Promoción no encontrada',
      });
    }

    // Validar que la promoción esté activa
    if (!promotion.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'La promoción asociada no está activa',
      });
    }

    // Validar usos de la promoción
    if (promotion.max_uses !== null && promotion.current_uses >= promotion.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'La promoción ha alcanzado el límite de usos',
      });
    }

    // Validar fechas
    const now = new Date();
    if (new Date(promotion.starts_at) > now) {
      return NextResponse.json({
        valid: false,
        error: 'Esta promoción aún no ha comenzado',
      });
    }
    if (promotion.ends_at && new Date(promotion.ends_at) < now) {
      return NextResponse.json({
        valid: false,
        error: 'Esta promoción ha expirado',
      });
    }

    // Validar scope si se proporcionó gallery_id
    if (gallery_id && promotion.scope === 'gallery' && promotion.scope_gallery_id !== gallery_id) {
      return NextResponse.json({
        valid: false,
        error: 'Este código no aplica para esta galería',
      });
    }

    if (gallery_id && promotion.scope === 'category') {
      const { data: gallery } = await supabase
        .from('galleries')
        .select('category_id')
        .eq('id', gallery_id)
        .single();

      if (gallery && gallery.category_id !== promotion.scope_category_id) {
        return NextResponse.json({
          valid: false,
          error: 'Este código no aplica para esta categoría',
        });
      }
    }

    if (gallery_id && promotion.scope === 'event_type') {
      const { data: gallery } = await supabase
        .from('galleries')
        .select('event_type')
        .eq('id', gallery_id)
        .single();

      if (gallery && gallery.event_type !== promotion.scope_event_type) {
        return NextResponse.json({
          valid: false,
          error: 'Este código no aplica para este tipo de evento',
        });
      }
    }

    // Validar min_photos
    if (photo_count && promotion.min_photos && photo_count < promotion.min_photos) {
      return NextResponse.json({
        valid: false,
        error: `Este código requiere al menos ${promotion.min_photos} fotos`,
      });
    }

    // Código válido - retornar preview
    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discount_percentage: promotion.discount_percentage,
        discount_amount: promotion.discount_amount,
        fixed_price_per_photo: promotion.fixed_price_per_photo,
        min_photos: promotion.min_photos,
        ends_at: promotion.ends_at,
      },
      promo_code_id: promoCode.id,
    });
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { valid: false, error: 'Error validando código' },
      { status: 500 }
    );
  }
}

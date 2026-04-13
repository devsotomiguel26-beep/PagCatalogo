import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/admin/promotions
 * Lista todas las promociones con sus códigos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, scheduled, expired, disabled

    let query = supabase
      .from('promotions')
      .select(`
        *,
        promo_codes (id, code, max_uses, current_uses, is_active),
        scope_gallery:galleries!promotions_scope_gallery_id_fkey (id, title),
        scope_category:categories!promotions_scope_category_id_fkey (id, name)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Filtro por estado
    const now = new Date().toISOString();
    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`);
    } else if (status === 'scheduled') {
      query = query
        .eq('is_active', true)
        .gt('starts_at', now);
    } else if (status === 'expired') {
      query = query
        .not('ends_at', 'is', null)
        .lt('ends_at', now);
    } else if (status === 'disabled') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in GET /api/admin/promotions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching promotions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotions
 * Crea una nueva promoción
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, description, type,
      discount_percentage, discount_amount, fixed_price_per_photo,
      scope, scope_gallery_id, scope_category_id, scope_event_type,
      min_photos, max_uses, requires_code,
      starts_at, ends_at,
      is_active, priority, stackable,
      codes, // Array de { code, max_uses } para crear códigos junto con la promo
    } = body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const validTypes = ['percentage_discount', 'fixed_discount', 'fixed_price_per_photo', 'full_gallery'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Tipo inválido. Debe ser uno de: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar valor de descuento según tipo
    if (type === 'percentage_discount' && (!discount_percentage || discount_percentage < 1 || discount_percentage > 100)) {
      return NextResponse.json(
        { success: false, error: 'El porcentaje de descuento debe estar entre 1 y 100' },
        { status: 400 }
      );
    }
    if (type === 'fixed_discount' && (!discount_amount || discount_amount < 1)) {
      return NextResponse.json(
        { success: false, error: 'El monto de descuento debe ser mayor a 0' },
        { status: 400 }
      );
    }
    if (type === 'fixed_price_per_photo' && (fixed_price_per_photo === undefined || fixed_price_per_photo < 0)) {
      return NextResponse.json(
        { success: false, error: 'El precio fijo por foto debe ser 0 o mayor' },
        { status: 400 }
      );
    }

    const validScopes = ['global', 'gallery', 'category', 'event_type'];
    if (scope && !validScopes.includes(scope)) {
      return NextResponse.json(
        { success: false, error: `Alcance inválido. Debe ser uno de: ${validScopes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar fechas
    if (ends_at && starts_at && new Date(ends_at) <= new Date(starts_at)) {
      return NextResponse.json(
        { success: false, error: 'La fecha de término debe ser posterior a la de inicio' },
        { status: 400 }
      );
    }

    // Insertar promoción
    const { data: promo, error: promoError } = await supabase
      .from('promotions')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        type,
        discount_percentage: type === 'percentage_discount' ? discount_percentage : null,
        discount_amount: type === 'fixed_discount' ? discount_amount : null,
        fixed_price_per_photo: type === 'fixed_price_per_photo' || type === 'full_gallery' ? fixed_price_per_photo : null,
        scope: scope || 'global',
        scope_gallery_id: scope === 'gallery' ? scope_gallery_id : null,
        scope_category_id: scope === 'category' ? scope_category_id : null,
        scope_event_type: scope === 'event_type' ? scope_event_type : null,
        min_photos: min_photos || 1,
        max_uses: max_uses || null,
        requires_code: requires_code || false,
        starts_at: starts_at || new Date().toISOString(),
        ends_at: ends_at || null,
        is_active: is_active !== undefined ? is_active : true,
        priority: priority || 0,
        stackable: stackable || false,
      }])
      .select()
      .single();

    if (promoError) {
      console.error('Error creating promotion:', promoError);
      throw promoError;
    }

    // Crear códigos si se proporcionaron
    if (codes && Array.isArray(codes) && codes.length > 0) {
      const codeRecords = codes.map((c: { code: string; max_uses?: number }) => ({
        code: c.code.trim().toUpperCase(),
        promotion_id: promo.id,
        max_uses: c.max_uses || null,
        is_active: true,
      }));

      const { error: codesError } = await supabase
        .from('promo_codes')
        .insert(codeRecords);

      if (codesError) {
        console.error('Error creating promo codes:', codesError);
        // No fallar, la promo ya se creó
      }
    }

    // Re-fetch con relaciones
    const { data: fullPromo } = await supabase
      .from('promotions')
      .select(`
        *,
        promo_codes (id, code, max_uses, current_uses, is_active)
      `)
      .eq('id', promo.id)
      .single();

    return NextResponse.json({
      success: true,
      data: fullPromo || promo,
      message: 'Promoción creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/promotions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating promotion' },
      { status: 500 }
    );
  }
}

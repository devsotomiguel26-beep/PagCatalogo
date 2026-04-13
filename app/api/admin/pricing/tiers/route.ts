import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Valida que un tier no se solape con los existentes
 */
async function validateTierRange(
  minPhotos: number,
  maxPhotos: number | null,
  excludeId?: string
): Promise<string | null> {
  const { data: existingTiers, error } = await supabase
    .from('pricing_tiers')
    .select('id, name, min_photos, max_photos')
    .eq('is_active', true)
    .order('sort_order');

  if (error) return 'Error validando rangos';

  for (const tier of existingTiers || []) {
    if (excludeId && tier.id === excludeId) continue;

    const tierMax = tier.max_photos ?? Infinity;
    const newMax = maxPhotos ?? Infinity;

    // Verificar solapamiento: [minA, maxA] ∩ [minB, maxB] ≠ ∅
    if (minPhotos <= tierMax && newMax >= tier.min_photos) {
      return `El rango ${minPhotos}-${maxPhotos ?? '∞'} se solapa con "${tier.name}" (${tier.min_photos}-${tier.max_photos ?? '∞'})`;
    }
  }

  return null;
}

/**
 * POST /api/admin/pricing/tiers
 * Crea un nuevo tier de descuento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, min_photos, max_photos, price_per_photo, discount_percentage, sort_order, is_active = true } = body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(min_photos) || min_photos < 1) {
      return NextResponse.json(
        { success: false, error: 'El mínimo de fotos debe ser al menos 1' },
        { status: 400 }
      );
    }

    if (max_photos !== null && max_photos !== undefined) {
      if (!Number.isInteger(max_photos) || max_photos < min_photos) {
        return NextResponse.json(
          { success: false, error: 'El máximo de fotos debe ser mayor o igual al mínimo' },
          { status: 400 }
        );
      }
    }

    if (!Number.isInteger(price_per_photo) || price_per_photo < 0) {
      return NextResponse.json(
        { success: false, error: 'El precio por foto debe ser un número entero positivo' },
        { status: 400 }
      );
    }

    if (discount_percentage !== undefined && (discount_percentage < 0 || discount_percentage > 100)) {
      return NextResponse.json(
        { success: false, error: 'El porcentaje de descuento debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    // Validar solapamiento de rangos
    const overlap = await validateTierRange(min_photos, max_photos ?? null);
    if (overlap) {
      return NextResponse.json(
        { success: false, error: overlap },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pricing_tiers')
      .insert([{
        name: name.trim(),
        min_photos,
        max_photos: max_photos ?? null,
        price_per_photo,
        discount_percentage: discount_percentage ?? 0,
        sort_order: sort_order ?? 0,
        is_active,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating tier:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Tier creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/pricing/tiers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating tier' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing/tiers
 * Actualiza un tier existente
 * Body: { id, name?, min_photos?, max_photos?, price_per_photo?, discount_percentage?, sort_order?, is_active? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID del tier es requerido' },
        { status: 400 }
      );
    }

    // Validaciones de campos si están presentes
    if (fields.name !== undefined && fields.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    if (fields.min_photos !== undefined && (!Number.isInteger(fields.min_photos) || fields.min_photos < 1)) {
      return NextResponse.json(
        { success: false, error: 'El mínimo de fotos debe ser al menos 1' },
        { status: 400 }
      );
    }

    if (fields.price_per_photo !== undefined && (!Number.isInteger(fields.price_per_photo) || fields.price_per_photo < 0)) {
      return NextResponse.json(
        { success: false, error: 'El precio por foto debe ser un número entero positivo' },
        { status: 400 }
      );
    }

    if (fields.discount_percentage !== undefined && (fields.discount_percentage < 0 || fields.discount_percentage > 100)) {
      return NextResponse.json(
        { success: false, error: 'El porcentaje de descuento debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    // Si cambian min/max, validar solapamiento
    if (fields.min_photos !== undefined || fields.max_photos !== undefined) {
      // Obtener datos actuales del tier para merge
      const { data: current } = await supabase
        .from('pricing_tiers')
        .select('min_photos, max_photos')
        .eq('id', id)
        .single();

      if (current) {
        const newMin = fields.min_photos ?? current.min_photos;
        const newMax = fields.max_photos !== undefined ? fields.max_photos : current.max_photos;

        if (newMax !== null && newMax < newMin) {
          return NextResponse.json(
            { success: false, error: 'El máximo de fotos debe ser mayor o igual al mínimo' },
            { status: 400 }
          );
        }

        const overlap = await validateTierRange(newMin, newMax, id);
        if (overlap) {
          return NextResponse.json(
            { success: false, error: overlap },
            { status: 400 }
          );
        }
      }
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (fields.name !== undefined) updateData.name = fields.name.trim();
    if (fields.min_photos !== undefined) updateData.min_photos = fields.min_photos;
    if (fields.max_photos !== undefined) updateData.max_photos = fields.max_photos;
    if (fields.price_per_photo !== undefined) updateData.price_per_photo = fields.price_per_photo;
    if (fields.discount_percentage !== undefined) updateData.discount_percentage = fields.discount_percentage;
    if (fields.sort_order !== undefined) updateData.sort_order = fields.sort_order;
    if (fields.is_active !== undefined) updateData.is_active = fields.is_active;

    const { data, error } = await supabase
      .from('pricing_tiers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tier:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Tier actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/pricing/tiers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating tier' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pricing/tiers
 * Elimina un tier
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID del tier es requerido' },
        { status: 400 }
      );
    }

    // Verificar que no sea el tier base (sort_order 0, min_photos 1)
    const { data: tier } = await supabase
      .from('pricing_tiers')
      .select('sort_order, min_photos')
      .eq('id', id)
      .single();

    if (tier && tier.min_photos === 1 && tier.sort_order === 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el tier de precio base' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pricing_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tier:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Tier eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/pricing/tiers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting tier' },
      { status: 500 }
    );
  }
}

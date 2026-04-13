import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/admin/promotions/[id]
 * Obtiene detalle de una promoción con sus códigos y uso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        promo_codes (id, code, max_uses, current_uses, is_active, created_at),
        scope_gallery:galleries!promotions_scope_gallery_id_fkey (id, title, slug),
        scope_category:categories!promotions_scope_category_id_fkey (id, name, slug),
        promotion_usage (id, discount_applied, created_at, photo_request_id)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Promoción no encontrada' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in GET /api/admin/promotions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching promotion' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/promotions/[id]
 * Actualiza una promoción
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name, description, type,
      discount_percentage, discount_amount, fixed_price_per_photo,
      scope, scope_gallery_id, scope_category_id, scope_event_type,
      min_photos, max_uses, requires_code,
      starts_at, ends_at,
      is_active, priority, stackable,
    } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (type !== undefined) updateData.type = type;
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount;
    if (fixed_price_per_photo !== undefined) updateData.fixed_price_per_photo = fixed_price_per_photo;
    if (scope !== undefined) {
      updateData.scope = scope;
      updateData.scope_gallery_id = scope === 'gallery' ? scope_gallery_id : null;
      updateData.scope_category_id = scope === 'category' ? scope_category_id : null;
      updateData.scope_event_type = scope === 'event_type' ? scope_event_type : null;
    }
    if (min_photos !== undefined) updateData.min_photos = min_photos;
    if (max_uses !== undefined) updateData.max_uses = max_uses || null;
    if (requires_code !== undefined) updateData.requires_code = requires_code;
    if (starts_at !== undefined) updateData.starts_at = starts_at;
    if (ends_at !== undefined) updateData.ends_at = ends_at || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;
    if (stackable !== undefined) updateData.stackable = stackable;

    const { data, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Promoción actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/promotions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating promotion' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promotions/[id]
 * Elimina una promoción y sus códigos (cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si tiene usos registrados
    const { count } = await supabase
      .from('promotion_usage')
      .select('id', { count: 'exact', head: true })
      .eq('promotion_id', params.id);

    if (count && count > 0) {
      // Soft delete: desactivar en vez de eliminar para preservar historial
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', params.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Promoción desactivada (tiene historial de uso, no se puede eliminar)',
        soft_deleted: true,
      });
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Promoción eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/promotions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting promotion' },
      { status: 500 }
    );
  }
}

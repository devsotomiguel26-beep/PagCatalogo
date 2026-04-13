import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/admin/promotions/[id]/codes
 * Lista todos los códigos de una promoción
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('promotion_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching codes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotions/[id]/codes
 * Crea un nuevo código para la promoción
 * Body: { code, max_uses? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code, max_uses } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El código es requerido' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Verificar que el código no exista
    const { data: existing } = await supabase
      .from('promo_codes')
      .select('id')
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: `El código "${normalizedCode}" ya existe` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert([{
        code: normalizedCode,
        promotion_id: params.id,
        max_uses: max_uses || null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;

    // Marcar la promoción como requires_code si no lo era
    await supabase
      .from('promotions')
      .update({ requires_code: true, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('requires_code', false);

    return NextResponse.json({
      success: true,
      data,
      message: 'Código creado exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating code' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/promotions/[id]/codes
 * Actualiza un código (activar/desactivar)
 * Body: { code_id, is_active?, max_uses? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code_id, is_active, max_uses } = body;

    if (!code_id) {
      return NextResponse.json(
        { success: false, error: 'code_id es requerido' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (max_uses !== undefined) updateData.max_uses = max_uses || null;

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', code_id)
      .eq('promotion_id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating code' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promotions/[id]/codes
 * Elimina un código
 * Body: { code_id }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code_id } = body;

    if (!code_id) {
      return NextResponse.json(
        { success: false, error: 'code_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar si tiene usos
    const { data: codeData } = await supabase
      .from('promo_codes')
      .select('current_uses')
      .eq('id', code_id)
      .single();

    if (codeData && codeData.current_uses > 0) {
      // Desactivar en vez de eliminar
      await supabase
        .from('promo_codes')
        .update({ is_active: false })
        .eq('id', code_id);

      return NextResponse.json({
        success: true,
        message: 'Código desactivado (tiene historial de uso)',
      });
    }

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', code_id)
      .eq('promotion_id', params.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Código eliminado',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting code' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/photographers/[id]
 * Obtiene un fotógrafo específico con sus estadísticas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('photographers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Fotógrafo no encontrado',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(`Error in GET /api/photographers/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching photographer',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/photographers/[id]
 * Actualiza un fotógrafo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      rut,
      bank_account_info,
      tax_id_type,
      notes,
      active,
    } = body;

    // Validaciones
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre no puede estar vacío',
        },
        { status: 400 }
      );
    }

    // Validar email si está presente
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email inválido',
        },
        { status: 400 }
      );
    }

    // Preparar datos a actualizar
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (rut !== undefined) updateData.rut = rut?.trim() || null;
    if (bank_account_info !== undefined) updateData.bank_account_info = bank_account_info;
    if (tax_id_type !== undefined) updateData.tax_id_type = tax_id_type;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('photographers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Fotógrafo no encontrado',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Fotógrafo actualizado exitosamente',
    });
  } catch (error: any) {
    console.error(`Error in PUT /api/photographers/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error updating photographer',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photographers/[id]
 * Elimina (desactiva) un fotógrafo
 * Nota: No se elimina físicamente, solo se marca como inactivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar si tiene galerías asignadas
    const { count: galleriesCount } = await supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', id);

    if (galleriesCount && galleriesCount > 0) {
      // No eliminar, solo desactivar
      const { data, error } = await supabase
        .from('photographers')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        message: `Fotógrafo desactivado (tiene ${galleriesCount} galería${galleriesCount > 1 ? 's' : ''} asignada${galleriesCount > 1 ? 's' : ''})`,
      });
    }

    // Si no tiene galerías, eliminar físicamente
    const { error } = await supabase
      .from('photographers')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Fotógrafo no encontrado',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Fotógrafo eliminado exitosamente',
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/photographers/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error deleting photographer',
      },
      { status: 500 }
    );
  }
}

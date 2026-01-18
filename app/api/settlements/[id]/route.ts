import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/settlements/[id]
 * Obtiene una liquidación específica con detalles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Liquidación no encontrada',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Obtener detalles de las solicitudes incluidas
    const { data: requests, error: requestsError } = await supabase
      .from('photo_requests')
      .select(`
        id,
        client_name,
        created_at,
        photo_ids,
        transaction_details,
        galleries (
          title
        )
      `)
      .in('id', data.photo_request_ids);

    if (requestsError) {
      console.warn('Error fetching requests:', requestsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        requests: requests || [],
      },
    });
  } catch (error: any) {
    console.error(`Error in GET /api/settlements/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching settlement',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settlements/[id]
 * Actualiza una liquidación (marca como pagada, agrega comprobante, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      status,
      payment_method,
      payment_proof_url,
      notes,
    } = body;

    // Preparar datos a actualizar
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (payment_proof_url !== undefined) updateData.payment_proof_url = payment_proof_url;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('settlements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Liquidación no encontrada',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Si se marca como pagada, actualizar las solicitudes a 'settled'
    if (status === 'paid') {
      await supabase
        .from('photo_requests')
        .update({
          settlement_status: 'settled',
        })
        .in('id', data.photo_request_ids);
    }

    // Si se cancela, revertir las solicitudes a 'pending'
    if (status === 'cancelled') {
      await supabase
        .from('photo_requests')
        .update({
          settlement_status: 'pending',
        })
        .in('id', data.photo_request_ids);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Liquidación actualizada exitosamente',
    });
  } catch (error: any) {
    console.error(`Error in PUT /api/settlements/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error updating settlement',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settlements/[id]
 * Elimina (cancela) una liquidación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Obtener liquidación para revertir las solicitudes
    const { data: settlement } = await supabase
      .from('settlements')
      .select('photo_request_ids, status')
      .eq('id', id)
      .single();

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: 'Liquidación no encontrada',
        },
        { status: 404 }
      );
    }

    // Si está pagada, no permitir eliminar
    if (settlement.status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar una liquidación pagada. Puede cancelarla primero.',
        },
        { status: 400 }
      );
    }

    // Revertir solicitudes a pending
    await supabase
      .from('photo_requests')
      .update({
        settlement_status: 'pending',
      })
      .in('id', settlement.photo_request_ids);

    // Eliminar liquidación
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Liquidación eliminada exitosamente',
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/settlements/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error deleting settlement',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/settlements
 * Lista todas las liquidaciones con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientType = searchParams.get('recipient_type');
    const recipientId = searchParams.get('recipient_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('settlements')
      .select('*')
      .order('settlement_date', { ascending: false });

    if (recipientType) {
      query = query.eq('recipient_type', recipientType);
    }

    if (recipientId) {
      query = query.eq('recipient_id', recipientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching settlements:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error in GET /api/settlements:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching settlements',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settlements
 * Crea una nueva liquidación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      period_start,
      period_end,
      recipient_type,
      recipient_id,
      photo_request_ids,
      payment_method,
      notes,
      created_by,
    } = body;

    // Validaciones
    if (!period_start || !period_end) {
      return NextResponse.json(
        {
          success: false,
          error: 'Las fechas de período son requeridas',
        },
        { status: 400 }
      );
    }

    if (!recipient_type || !['photographer', 'director'].includes(recipient_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de destinatario inválido (photographer o director)',
        },
        { status: 400 }
      );
    }

    if (recipient_type === 'photographer' && !recipient_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID del fotógrafo es requerido',
        },
        { status: 400 }
      );
    }

    if (!photo_request_ids || photo_request_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe incluir al menos una solicitud',
        },
        { status: 400 }
      );
    }

    // Obtener solicitudes para calcular total
    const { data: requests, error: requestsError } = await supabase
      .from('photo_requests')
      .select('id, transaction_details')
      .in('id', photo_request_ids);

    if (requestsError) {
      throw requestsError;
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontraron las solicitudes especificadas',
        },
        { status: 404 }
      );
    }

    // Calcular total de la liquidación
    // Soporta AMBAS estructuras de transaction_details (nueva y antigua)
    const totalAmount = requests.reduce((sum, request) => {
      if (!request.transaction_details) return sum;

      const td = request.transaction_details;

      // COALESCE: intentar nivel superior primero, luego breakdown
      const share = recipient_type === 'photographer'
        ? td.photographer_share || td.breakdown?.photographer_share || 0
        : td.director_share || td.breakdown?.director_share || 0;

      return sum + parseFloat(share.toString());
    }, 0);

    // Obtener nombre del destinatario
    let recipientName = '';
    if (recipient_type === 'photographer' && recipient_id) {
      const { data: photographer } = await supabase
        .from('photographers')
        .select('name')
        .eq('id', recipient_id)
        .single();

      recipientName = photographer?.name || 'Fotógrafo Desconocido';
    } else {
      recipientName = process.env.DIRECTOR_NAME || 'Director Academia';
    }

    // Crear liquidación
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .insert([
        {
          settlement_date: new Date().toISOString().split('T')[0],
          period_start,
          period_end,
          recipient_type,
          recipient_id: recipient_type === 'photographer' ? recipient_id : null,
          recipient_name: recipientName,
          total_amount: Math.round(totalAmount),
          photo_request_ids,
          payment_method: payment_method || null,
          status: 'pending',
          notes: notes || null,
          created_by: created_by || 'admin',
        },
      ])
      .select()
      .single();

    if (settlementError) {
      console.error('Error creating settlement:', settlementError);
      throw settlementError;
    }

    // Actualizar estado de las solicitudes a 'partial' si aún no están settled
    await supabase
      .from('photo_requests')
      .update({
        settlement_status: 'partial',
      })
      .in('id', photo_request_ids)
      .neq('settlement_status', 'settled');

    return NextResponse.json({
      success: true,
      data: settlement,
      message: 'Liquidación creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error in POST /api/settlements:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error creating settlement',
      },
      { status: 500 }
    );
  }
}

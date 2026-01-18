import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/settlements/preview
 * Previsualiza una liquidación antes de crearla
 * Muestra qué solicitudes serían incluidas y el total
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      period_start,
      period_end,
      recipient_type,
      recipient_id,
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
          error: 'Tipo de destinatario inválido',
        },
        { status: 400 }
      );
    }

    // Construir query según el tipo de destinatario
    let query = supabase
      .from('pending_earnings')
      .select('*')
      .gte('request_date', period_start)
      .lte('request_date', period_end)
      .order('request_date', { ascending: false });

    // Filtrar por fotógrafo si aplica
    if (recipient_type === 'photographer') {
      if (!recipient_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'El ID del fotógrafo es requerido',
          },
          { status: 400 }
        );
      }
      query = query.eq('photographer_id', recipient_id);
    }

    const { data: pendingEarnings, error } = await query;

    if (error) {
      console.error('Error fetching pending earnings:', error);
      throw error;
    }

    if (!pendingEarnings || pendingEarnings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          requests: [],
          total_amount: 0,
          request_ids: [],
          message: 'No hay ganancias pendientes en el período seleccionado',
        },
      });
    }

    // Calcular totales
    const totalAmount = pendingEarnings.reduce((sum, earning: any) => {
      const share = recipient_type === 'photographer'
        ? parseFloat(earning.photographer_share || 0)
        : parseFloat(earning.director_share || 0);
      return sum + share;
    }, 0);

    const requestIds = pendingEarnings.map((e: any) => e.request_id);

    return NextResponse.json({
      success: true,
      data: {
        requests: pendingEarnings,
        total_amount: Math.round(totalAmount),
        request_ids: requestIds,
        total_requests: pendingEarnings.length,
        total_photos: pendingEarnings.reduce((sum: number, e: any) => sum + (e.photo_count || 0), 0),
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/settlements/preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error generating preview',
      },
      { status: 500 }
    );
  }
}

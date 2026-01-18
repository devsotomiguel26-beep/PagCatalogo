import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/photographers/[id]/earnings
 * Obtiene las ganancias detalladas de un fotógrafo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que el fotógrafo existe
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (photographerError) {
      if (photographerError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Fotógrafo no encontrado',
          },
          { status: 404 }
        );
      }
      throw photographerError;
    }

    // Obtener ganancias desde la vista
    const { data: summary, error: summaryError } = await supabase
      .from('photographer_earnings_summary')
      .select('*')
      .eq('photographer_id', id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      throw summaryError;
    }

    // Obtener ganancias pendientes detalladas
    const { data: pendingEarnings, error: pendingError } = await supabase
      .from('pending_earnings')
      .select('*')
      .eq('photographer_id', id)
      .order('request_date', { ascending: false });

    if (pendingError) {
      throw pendingError;
    }

    // Obtener liquidaciones del fotógrafo
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('recipient_type', 'photographer')
      .eq('recipient_id', id)
      .order('settlement_date', { ascending: false });

    if (settlementsError) {
      throw settlementsError;
    }

    return NextResponse.json({
      success: true,
      data: {
        photographer,
        summary: summary || {
          photographer_id: id,
          photographer_name: photographer.name,
          total_requests: 0,
          total_photos: 0,
          total_earnings: 0,
          paid_amount: 0,
          pending_amount: 0,
        },
        pending_earnings: pendingEarnings || [],
        settlements: settlements || [],
      },
    });
  } catch (error: any) {
    console.error(`Error in GET /api/photographers/${params.id}/earnings:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching photographer earnings',
      },
      { status: 500 }
    );
  }
}

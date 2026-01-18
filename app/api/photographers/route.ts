import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con permisos de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/photographers
 * Lista todos los fotógrafos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('photographers')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching photographers:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error in GET /api/photographers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching photographers',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photographers
 * Crea un nuevo fotógrafo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      rut,
      bank_account_info,
      tax_id_type,
      notes,
      active = true,
    } = body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre es requerido',
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

    const { data, error } = await supabase
      .from('photographers')
      .insert([
        {
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          rut: rut?.trim() || null,
          bank_account_info,
          tax_id_type: tax_id_type || 'ninguno',
          notes: notes?.trim() || null,
          active,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating photographer:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Fotógrafo creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in POST /api/photographers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error creating photographer',
      },
      { status: 500 }
    );
  }
}

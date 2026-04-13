import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { invalidatePricingCache } from '@/lib/pricingTiers';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/admin/pricing
 * Retorna configuración global + todos los tiers
 */
export async function GET() {
  try {
    const [configResult, tiersResult] = await Promise.all([
      supabase.from('pricing_config').select('*').single(),
      supabase.from('pricing_tiers').select('*').order('sort_order', { ascending: true }),
    ]);

    if (configResult.error) {
      console.error('Error fetching pricing config:', configResult.error);
      throw configResult.error;
    }

    if (tiersResult.error) {
      console.error('Error fetching pricing tiers:', tiersResult.error);
      throw tiersResult.error;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          config: configResult.data,
          tiers: tiersResult.data,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (error: any) {
    console.error('Error in GET /api/admin/pricing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching pricing data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing
 * Actualiza configuración global de precios
 * Body: { base_price_per_photo, pricing_tiers_enabled }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { base_price_per_photo, pricing_tiers_enabled } = body;

    if (base_price_per_photo !== undefined) {
      if (!Number.isInteger(base_price_per_photo) || base_price_per_photo < 100) {
        return NextResponse.json(
          { success: false, error: 'El precio base debe ser un número entero mayor o igual a 100' },
          { status: 400 }
        );
      }
    }

    // Obtener el ID de la fila de config (singleton)
    const { data: existing, error: fetchError } = await supabase
      .from('pricing_config')
      .select('id')
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'No se encontró la configuración de precios' },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (base_price_per_photo !== undefined) updateData.base_price_per_photo = base_price_per_photo;
    if (pricing_tiers_enabled !== undefined) updateData.pricing_tiers_enabled = pricing_tiers_enabled;

    const { data, error } = await supabase
      .from('pricing_config')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing config:', error);
      throw error;
    }

    invalidatePricingCache();
    return NextResponse.json({
      success: true,
      data,
      message: 'Configuración de precios actualizada',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/pricing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating pricing config' },
      { status: 500 }
    );
  }
}

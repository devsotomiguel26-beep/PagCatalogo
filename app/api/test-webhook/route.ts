import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Endpoint de prueba para verificar webhooks recientes
export async function GET(request: NextRequest) {
  try {
    // Obtener últimas solicitudes
    const { data: requests, error } = await supabase
      .from('photo_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Últimas 5 solicitudes',
      requests: requests?.map(r => ({
        id: r.id,
        client_name: r.client_name,
        client_email: r.client_email,
        status: r.status,
        flow_order: r.flow_order,
        photos_sent_at: r.photos_sent_at,
        created_at: r.created_at,
        payment_date: r.payment_date,
      })),
      env_check: {
        hasFlowApiKey: !!process.env.FLOW_API_KEY,
        hasFlowSecretKey: !!process.env.FLOW_SECRET_KEY,
        hasGmailUser: !!process.env.GMAIL_USER,
        hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
        flowSandbox: process.env.FLOW_SANDBOX,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

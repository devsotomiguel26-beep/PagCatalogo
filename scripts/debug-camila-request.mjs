import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCamilaRequest() {
  console.log('🔍 Buscando solicitud de Camila Romero...\n');

  // Buscar por nombre de cliente y flow_order
  const { data: requests, error } = await supabase
    .from('photo_requests')
    .select(`
      id,
      client_name,
      client_email,
      status,
      flow_order,
      payment_date,
      photo_ids,
      price_per_photo,
      transaction_details,
      settlement_status,
      gallery_id,
      galleries (
        id,
        title,
        photographer_id,
        commission_config
      )
    `)
    .ilike('client_name', '%camila%romero%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('❌ No se encontró solicitud de Camila Romero');
    return;
  }

  console.log(`✅ Encontradas ${requests.length} solicitud(es)\n`);

  for (const request of requests) {
    console.log('='.repeat(80));
    console.log('📋 SOLICITUD:', request.id);
    console.log('='.repeat(80));
    console.log('Cliente:', request.client_name);
    console.log('Email:', request.client_email);
    console.log('Estado:', request.status);
    console.log('Flow Order:', request.flow_order);
    console.log('Fecha Pago:', request.payment_date);
    console.log('Fotos:', request.photo_ids?.length || 0);
    console.log('Precio por foto:', request.price_per_photo);
    console.log('Settlement Status:', request.settlement_status);
    console.log('\n--- GALERÍA ---');
    console.log('ID:', request.galleries?.id);
    console.log('Título:', request.galleries?.title);
    console.log('Photographer ID:', request.galleries?.photographer_id || 'SIN ASIGNAR');
    console.log('Commission Config:', JSON.stringify(request.galleries?.commission_config, null, 2));

    console.log('\n--- TRANSACTION DETAILS ---');
    if (request.transaction_details) {
      console.log('✅ Tiene transaction_details:');
      console.log(JSON.stringify(request.transaction_details, null, 2));
    } else {
      console.log('❌ NO tiene transaction_details (NULL)');
    }
    console.log('\n');
  }

  // Verificar si aparece en pending_earnings
  console.log('='.repeat(80));
  console.log('🔍 Verificando en vista pending_earnings...');
  console.log('='.repeat(80));

  const { data: pendingEarnings, error: pendingError } = await supabase
    .from('pending_earnings')
    .select('*')
    .ilike('client_name', '%camila%romero%');

  if (pendingError) {
    console.error('❌ Error consultando pending_earnings:', pendingError);
  } else if (!pendingEarnings || pendingEarnings.length === 0) {
    console.log('❌ NO aparece en pending_earnings');
    console.log('\n💡 Posibles causas:');
    console.log('   1. transaction_details es NULL');
    console.log('   2. settlement_status ya es "settled"');
    console.log('   3. photographer_id de la galería es NULL y estás filtrando por fotógrafo');
    console.log('   4. status no es paid/delivered/expired');
  } else {
    console.log('✅ SÍ aparece en pending_earnings:');
    console.log(JSON.stringify(pendingEarnings, null, 2));
  }
}

debugCamilaRequest()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

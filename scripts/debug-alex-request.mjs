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

async function debugAlexRequest() {
  console.log('🔍 Investigando solicitud de Alex Beiza...\n');

  // Buscar la solicitud
  const { data: requests, error } = await supabase
    .from('photo_requests')
    .select(`
      id,
      client_name,
      client_email,
      status,
      settlement_status,
      flow_order,
      payment_date,
      photo_ids,
      price_per_photo,
      transaction_details,
      created_at,
      galleries (
        id,
        title,
        photographer_id,
        photographers (
          id,
          name
        )
      )
    `)
    .ilike('client_name', '%alex%beiza%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('❌ No se encontró solicitud de Alex Beiza');
    return;
  }

  console.log(`✅ Encontradas ${requests.length} solicitud(es)\n`);

  for (const request of requests) {
    console.log('='.repeat(80));
    console.log('📋 DATOS GENERALES:');
    console.log('='.repeat(80));
    console.log('ID:', request.id);
    console.log('Cliente:', request.client_name);
    console.log('Email:', request.client_email);
    console.log('Galería:', request.galleries?.title);
    console.log('Fotógrafo:', request.galleries?.photographers?.name || 'NO ASIGNADO');
    console.log('Fotógrafo ID:', request.galleries?.photographer_id || 'NULL');
    console.log();

    console.log('='.repeat(80));
    console.log('📊 ESTADO DE LA SOLICITUD:');
    console.log('='.repeat(80));
    console.log('Status:', request.status);
    console.log('Settlement Status:', request.settlement_status);
    console.log('Flow Order:', request.flow_order);
    console.log('Payment Date:', request.payment_date);
    console.log('Fecha Creación:', request.created_at);
    console.log();

    console.log('='.repeat(80));
    console.log('💰 DETALLES DE PAGO:');
    console.log('='.repeat(80));
    console.log('Cantidad de fotos:', request.photo_ids?.length || 0);
    console.log('Precio por foto:', request.price_per_photo);

    if (request.transaction_details) {
      console.log('\n📋 Transaction Details COMPLETO:');
      console.log(JSON.stringify(request.transaction_details, null, 2));

      const td = request.transaction_details;
      console.log('\n🔍 VALORES EXTRAÍDOS:');
      console.log('- Gross Amount:', td.gross_amount);
      console.log('- Gateway Fee:', td.gateway_fee);
      console.log('- Net Amount:', td.net_amount);
      console.log('- Photographer Share (nivel superior):', td.photographer_share);
      console.log('- Director Share (nivel superior):', td.director_share);
      console.log('- Photographer Percentage:', td.photographer_percentage);
      console.log('- Director Percentage:', td.director_percentage);

      if (td.breakdown) {
        console.log('\n📦 Breakdown Object:');
        console.log('- Photographer Share (breakdown):', td.breakdown.photographer_share);
        console.log('- Director Share (breakdown):', td.breakdown.director_share);
      }
    } else {
      console.log('❌ NO tiene transaction_details (NULL)');
    }
    console.log();
  }

  // Ahora verificar si aparece en pending_earnings
  console.log('='.repeat(80));
  console.log('🔍 VERIFICANDO EN VISTA pending_earnings:');
  console.log('='.repeat(80));

  const { data: pendingEarnings, error: pendingError } = await supabase
    .from('pending_earnings')
    .select('*')
    .ilike('client_name', '%alex%beiza%');

  if (pendingError) {
    console.error('❌ Error consultando pending_earnings:', pendingError);
  } else if (!pendingEarnings || pendingEarnings.length === 0) {
    console.log('❌ NO APARECE en pending_earnings');
    console.log('\n🔍 REQUISITOS DE LA VISTA pending_earnings:');
    console.log('1. status IN (\'paid\', \'delivered\', \'expired\')');
    console.log('2. settlement_status != \'settled\'');
    console.log('3. transaction_details IS NOT NULL');
    console.log('\nVERIFICANDO cada requisito para Alex Beiza:');

    if (requests[0]) {
      const req = requests[0];
      console.log(`✓ Status: "${req.status}" → ${['paid', 'delivered', 'expired'].includes(req.status) ? '✅ CUMPLE' : '❌ NO CUMPLE'}`);
      console.log(`✓ Settlement Status: "${req.settlement_status}" → ${req.settlement_status !== 'settled' ? '✅ CUMPLE' : '❌ NO CUMPLE (está marcado como settled)'}`);
      console.log(`✓ Transaction Details: ${req.transaction_details ? '✅ CUMPLE' : '❌ NO CUMPLE (es NULL)'}`);
    }
  } else {
    console.log('✅ SÍ APARECE en pending_earnings:');
    console.log(JSON.stringify(pendingEarnings, null, 2));
  }
}

debugAlexRequest()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

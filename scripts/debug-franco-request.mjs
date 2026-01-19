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

async function debugBothRequests() {
  console.log('🔍 Comparando estructuras de transaction_details...\n');

  // Buscar ambas solicitudes
  const { data: requests, error } = await supabase
    .from('photo_requests')
    .select(`
      id,
      client_name,
      transaction_details,
      galleries (
        title
      )
    `)
    .or('client_name.ilike.%camila%romero%,client_name.ilike.%franco%illino%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log('❌ No se encontraron solicitudes');
    return;
  }

  console.log(`✅ Encontradas ${requests.length} solicitud(es)\n`);

  for (const request of requests) {
    console.log('='.repeat(80));
    console.log('Cliente:', request.client_name);
    console.log('Galería:', request.galleries?.title);
    console.log('='.repeat(80));

    if (request.transaction_details) {
      console.log('📋 ESTRUCTURA COMPLETA:');
      console.log(JSON.stringify(request.transaction_details, null, 2));

      console.log('\n🔍 ANÁLISIS:');
      const td = request.transaction_details;

      // Verificar si tiene photographer_share en nivel superior
      if (td.photographer_share !== undefined) {
        console.log('✅ Tiene photographer_share en nivel superior:', td.photographer_share);
      } else {
        console.log('❌ NO tiene photographer_share en nivel superior');
      }

      // Verificar si tiene breakdown
      if (td.breakdown) {
        console.log('✅ Tiene objeto breakdown:');
        console.log('   - photographer_share:', td.breakdown.photographer_share);
        console.log('   - director_share:', td.breakdown.director_share);
      } else {
        console.log('❌ NO tiene objeto breakdown');
      }
    } else {
      console.log('❌ NO tiene transaction_details (NULL)');
    }
    console.log('\n');
  }
}

debugBothRequests()
  .then(() => {
    console.log('✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

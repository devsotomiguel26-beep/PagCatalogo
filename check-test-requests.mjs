import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICANDO SOLICITUDES DE PRUEBA\n');
console.log('='.repeat(80));

const { data: allRequests, error } = await supabase
  .from('photo_requests')
  .select('id, client_name, status, is_test, is_archived')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`\n📊 Total de solicitudes: ${allRequests.length}\n`);

const testRequests = allRequests.filter(r => r.is_test === true);
const productionRequests = allRequests.filter(r => !r.is_test);

console.log('🧪 SOLICITUDES DE PRUEBA:');
if (testRequests.length === 0) {
  console.log('   ⚠️  No hay solicitudes marcadas como prueba\n');
} else {
  testRequests.forEach(r => {
    console.log(`   - ${r.client_name} (${r.status}) [is_test: ${r.is_test}]`);
  });
  console.log(`   Total: ${testRequests.length}\n`);
}

console.log('✅ SOLICITUDES PRODUCTIVAS:');
if (productionRequests.length === 0) {
  console.log('   ⚠️  No hay solicitudes productivas\n');
} else {
  productionRequests.forEach(r => {
    console.log(`   - ${r.client_name} (${r.status}) [is_test: ${r.is_test || false}]`);
  });
  console.log(`   Total: ${productionRequests.length}\n`);
}

console.log('='.repeat(80));
console.log('\n💡 Si marcaste solicitudes como prueba pero is_test es NULL o false,');
console.log('   verifica que la migración SQL se haya ejecutado correctamente.\n');

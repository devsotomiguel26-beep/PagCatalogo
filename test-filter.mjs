import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 PROBANDO DIFERENTES FILTROS\n');
console.log('='.repeat(80));

// Test 1: Filtro original
console.log('\n1️⃣ Test con .eq(is_test, false)');
const { data: test1, error: err1 } = await supabase
  .from('photo_requests')
  .select('id, client_name, is_test')
  .eq('is_test', false)
  .order('created_at', { ascending: false });

if (err1) console.error('Error:', err1.message);
else {
  console.log(`   Resultados: ${test1.length}`);
  test1.forEach(r => console.log(`   - ${r.client_name} [is_test: ${r.is_test}]`));
}

// Test 2: Filtro con .not()
console.log('\n2️⃣ Test con .not(is_test, eq, true)');
const { data: test2, error: err2 } = await supabase
  .from('photo_requests')
  .select('id, client_name, is_test')
  .not('is_test', 'eq', true)
  .order('created_at', { ascending: false });

if (err2) console.error('Error:', err2.message);
else {
  console.log(`   Resultados: ${test2.length}`);
  test2.forEach(r => console.log(`   - ${r.client_name} [is_test: ${r.is_test}]`));
}

// Test 3: Filtro con .or()
console.log('\n3️⃣ Test con .or(is_test.is.null,is_test.eq.false)');
const { data: test3, error: err3 } = await supabase
  .from('photo_requests')
  .select('id, client_name, is_test')
  .or('is_test.is.null,is_test.eq.false')
  .order('created_at', { ascending: false });

if (err3) console.error('Error:', err3.message);
else {
  console.log(`   Resultados: ${test3.length}`);
  test3.forEach(r => console.log(`   - ${r.client_name} [is_test: ${r.is_test}]`));
}

// Test 4: Sin filtro y filtrar en JS
console.log('\n4️⃣ Test sin filtro (filtrado en JS)');
const { data: test4, error: err4 } = await supabase
  .from('photo_requests')
  .select('id, client_name, is_test')
  .order('created_at', { ascending: false });

if (err4) console.error('Error:', err4.message);
else {
  const filtered = test4.filter(r => r.is_test !== true);
  console.log(`   Total: ${test4.length}, Filtrados: ${filtered.length}`);
  filtered.forEach(r => console.log(`   - ${r.client_name} [is_test: ${r.is_test}]`));
}

console.log('\n' + '='.repeat(80));

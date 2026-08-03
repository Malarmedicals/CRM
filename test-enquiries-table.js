require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing enquiries table...');
  const { data, error } = await supabase.from('enquiries').select('*').limit(5);
  if (error) {
    console.error('Error selecting from enquiries:', error.message, error);
  } else {
    console.log('Success! enquiries table exists. Rows:', data);
  }
}
test();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing stages in leads table...');
  const testLead = {
    name: 'Ongoing Enquiry User',
    email: 'ongoing@malar.com',
    phone: '9876543210',
    stage: 'ongoing',
    priority: 'high',
    notes: '[PRODUCT ENQUIRY] Dolo 650mg | Message: Checking stock',
    customervalue: 'prescription'
  };
  const { data, error } = await supabase.from('leads').insert(testLead).select().single();
  if (error) {
    console.error('Error inserting stage ongoing:', error.message);
  } else {
    console.log('Success inserting stage ongoing:', data);
    await supabase.from('leads').delete().eq('id', data.id);
  }
}
test();

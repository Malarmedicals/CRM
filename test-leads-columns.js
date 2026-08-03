require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing insert into leads table with snake_case / basic fields...');
  const testLead = {
    name: 'Test Enquiry User',
    email: 'testenquiry@malar.com',
    phone: '9876543210',
    stage: 'new',
    priority: 'high',
    notes: 'PRODUCT ENQUIRY: Dolo 650mg | Message: Do you have stock available?',
    customer_value: 'regular'
  };
  const { data, error } = await supabase.from('leads').insert(testLead).select().single();
  if (error) {
    console.error('Error inserting with customer_value:', error.message);
    const fallbackLead = {
      name: 'Test Enquiry User',
      email: 'testenquiry@malar.com',
      phone: '9876543210',
      stage: 'new',
      priority: 'high',
      notes: 'PRODUCT ENQUIRY: Dolo 650mg | Message: Do you have stock available?'
    };
    const { data: data2, error: error2 } = await supabase.from('leads').insert(fallbackLead).select().single();
    if (error2) {
      console.error('Error inserting fallbackLead:', error2.message);
    } else {
      console.log('Success! Inserted fallbackLead:', data2);
      await supabase.from('leads').delete().eq('id', data2.id);
    }
  } else {
    console.log('Success! Inserted testLead:', data);
    await supabase.from('leads').delete().eq('id', data.id);
  }
}
test();

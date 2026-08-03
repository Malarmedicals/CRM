require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Creating enquiries table via run_sql rpc...');
  const { data, error } = await supabase.rpc('run_sql', { sql: `
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      type VARCHAR(50) NOT NULL DEFAULT 'general',
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      message TEXT,
      product_id VARCHAR(100),
      product_name VARCHAR(255),
      product_price NUMERIC,
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      notes TEXT,
      assigned_to VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `});

  if (error) {
    console.error('Error with run_sql:', error.message);
  } else {
    console.log('enquiries table created via run_sql!');
  }
}
createTable();

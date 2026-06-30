const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { sql: `
    CREATE TABLE IF NOT EXISTS seo_content_blocks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      page_type VARCHAR NOT NULL,
      page_slug VARCHAR NOT NULL,
      meta_title VARCHAR,
      meta_description TEXT,
      intro_html TEXT,
      sections JSONB DEFAULT '[]',
      faqs JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(page_type, page_slug)
    );
  `});
  
  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Table created successfully');
  }
}
run();

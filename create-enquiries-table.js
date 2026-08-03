require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Missing DB URL in .env.local');
    return;
  }
  const sql = postgres(dbUrl, { ssl: 'require' });
  try {
    console.log('Creating enquiries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(100) PRIMARY KEY,
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
    `;
    console.log('Enquiries table created.');

    console.log('Configuring RLS policies...');
    try {
      await sql`ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;`;
      await sql`DROP POLICY IF EXISTS "Allow public insert to enquiries" ON enquiries;`;
      await sql`DROP POLICY IF EXISTS "Allow public select to enquiries" ON enquiries;`;
      await sql`DROP POLICY IF EXISTS "Allow public update to enquiries" ON enquiries;`;
      await sql`DROP POLICY IF EXISTS "Allow public delete to enquiries" ON enquiries;`;

      await sql`CREATE POLICY "Allow public insert to enquiries" ON enquiries FOR INSERT WITH CHECK (true);`;
      await sql`CREATE POLICY "Allow public select to enquiries" ON enquiries FOR SELECT USING (true);`;
      await sql`CREATE POLICY "Allow public update to enquiries" ON enquiries FOR UPDATE USING (true);`;
      await sql`CREATE POLICY "Allow public delete to enquiries" ON enquiries FOR DELETE USING (true);`;
      console.log('RLS policies configured.');
    } catch (rlsError) {
      console.warn('Note on RLS:', rlsError.message);
    }
  } catch (e) {
    console.error('Error creating enquiries table:', e);
  } finally {
    await sql.end();
  }
}

run();

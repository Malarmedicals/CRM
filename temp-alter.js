require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

async function run() {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('No DB URL');
        return;
    }
    const sql = postgres(dbUrl);
    try {
        await sql`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';`;
        console.log('Added status column');
    } catch (e) {
        console.error('Error altering table', e);
    } finally {
        await sql.end();
    }
}
run();

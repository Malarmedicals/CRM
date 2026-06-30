require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');

async function run() {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('No DB URL found in .env.local');
        return;
    }
    const sql = postgres(dbUrl);
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS public.seo_content_blocks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                page_type TEXT NOT NULL,
                page_slug TEXT NOT NULL,
                meta_title TEXT,
                meta_description TEXT,
                intro_html TEXT,
                sections JSONB DEFAULT '[]'::jsonb,
                faqs JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS seo_content_blocks_type_slug_idx 
            ON public.seo_content_blocks (page_type, page_slug);
        `;

        console.log('Successfully created seo_content_blocks table and unique index.');
    } catch (e) {
        console.error('Error creating table', e);
    } finally {
        await sql.end();
    }
}
run();

require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');

async function run() {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('Missing DB URL');
        return;
    }
    const sql = postgres(dbUrl);
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `;
        console.log(columns);
        
        // Add additional_images if it doesn't exist
        const hasAdditionalImages = columns.some(c => c.column_name === 'additional_images');
        if (!hasAdditionalImages) {
            console.log('Adding additional_images column...');
            await sql`ALTER TABLE products ADD COLUMN additional_images JSONB`;
            console.log('Column added.');
        }
    } catch(e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

run();

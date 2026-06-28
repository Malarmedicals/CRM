require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key');
        return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.storage.createBucket('products', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
        console.error('Error creating bucket:', error.message);
    } else {
        console.log('Bucket created successfully:', data);
    }
}
run();

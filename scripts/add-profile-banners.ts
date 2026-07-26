import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually since dotenv might not be available
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key.trim()] = val.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
    return acc;
  }, {} as Record<string, string>);

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Adding profile banners...');
  
  const banners = [
    {
      name: 'First Order Discount',
      alt_text: 'Flat 25% OFF',
      position: 'PROFILE_PAGE',
      redirect_type: 'Category',
      redirect_target: 'all',
      open_in: 'Same Tab',
      status: 'Active',
      displayOrder: 1,
      image_url: '/images/nano_banana_discount.png'
    },
    {
      name: 'Plus Membership',
      alt_text: 'Care Plan',
      position: 'PROFILE_PAGE',
      redirect_type: 'Category',
      redirect_target: 'all',
      open_in: 'Same Tab',
      status: 'Active',
      displayOrder: 2,
      image_url: '/images/nano_banana_care.png'
    },
    {
      name: 'Full Body Checkup',
      alt_text: 'Lab Tests',
      position: 'PROFILE_PAGE',
      redirect_type: 'Category',
      redirect_target: 'all',
      open_in: 'Same Tab',
      status: 'Active',
      displayOrder: 3,
      image_url: '/images/nano_banana_lab.png'
    }
  ];

  for (const banner of banners) {
    const { data, error } = await supabase.from('banners').insert(banner);
    if (error) {
      console.error('Error inserting banner:', banner.name, error);
    } else {
      console.log('Successfully inserted:', banner.name);
    }
  }
  
  console.log('Done!');
}

main();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  await supabase.from('banners').update({ position: 'TOP' }).eq('name', 'First Order Discount');
  await supabase.from('banners').update({ position: 'MIDDLE' }).eq('name', 'Plus Membership');
  await supabase.from('banners').update({ position: 'BOTTOM' }).eq('name', 'Full Body Checkup');
  console.log('Successfully organized existing banners across TOP, MIDDLE, and BOTTOM positions!');
}

main();

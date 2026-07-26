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
  const images = [
    { name: 'nano_banana_discount.png', path: path.join('..', 'e-Commerce', 'public', 'images', 'nano_banana_discount.png') },
    { name: 'nano_banana_care.png', path: path.join('..', 'e-Commerce', 'public', 'images', 'nano_banana_care.png') },
    { name: 'nano_banana_lab.png', path: path.join('..', 'e-Commerce', 'public', 'images', 'nano_banana_lab.png') }
  ];

  for (const img of images) {
    if (!fs.existsSync(img.path)) {
      console.log('File not found:', img.path);
      continue;
    }
    const fileBuffer = fs.readFileSync(img.path);
    const { data, error } = await supabase.storage.from('banners').upload(img.name, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });
    
    if (error) {
      console.error('Upload error for', img.name, error);
    } else {
      const { data: publicUrlData } = supabase.storage.from('banners').getPublicUrl(img.name);
      console.log('Uploaded', img.name, publicUrlData.publicUrl);
      
      // Update the banner in the database
      const relativePath = `/images/${img.name}`;
      await supabase.from('banners').update({ image_url: publicUrlData.publicUrl }).eq('image_url', relativePath);
    }
  }
}

main();

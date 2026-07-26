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
  console.log('Copying generated category banners to public image folders...');
  
  const srcDir = 'C:\\Users\\svish\\.gemini\\antigravity-ide\\brain\\ae04d472-a089-42ca-8d95-e568382ebb88';
  const eCommImgDir = 'c:\\Users\\svish\\Downloads\\Malar Medicals\\e-Commerce\\public\\images';
  const crmImgDir = 'c:\\Users\\svish\\Downloads\\Malar Medicals\\CRM\\public\\images';

  const imgMappings = [
    { src: 'medical_equip_banner_1785093473167.png', dest: 'category_banner_medical_equipment.png' },
    { src: 'pharmacy_pills_banner_1785093482137.png', dest: 'category_banner_pharmacy_sale.png' },
    { src: 'wellness_care_banner_1785093492313.png', dest: 'category_banner_wellness_care.png' },
  ];

  for (const item of imgMappings) {
    const srcPath = path.join(srcDir, item.src);
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(eCommImgDir)) fs.mkdirSync(eCommImgDir, { recursive: true });
      if (!fs.existsSync(crmImgDir)) fs.mkdirSync(crmImgDir, { recursive: true });
      fs.copyFileSync(srcPath, path.join(eCommImgDir, item.dest));
      fs.copyFileSync(srcPath, path.join(crmImgDir, item.dest));
      console.log(`Copied ${item.dest} to both e-Commerce and CRM.`);
    } else {
      console.warn(`Warning: Source image not found at ${srcPath}`);
    }
  }

  console.log('Deleting existing 3 old banners from Supabase...');
  const { error: delError } = await supabase
    .from('banners')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (delError) {
    console.error('Error deleting old banners:', delError);
  } else {
    console.log('Successfully removed old banners.');
  }

  const newBanners = [
    {
      name: 'Medical Equipment Super Sale',
      position: 'TOP',
      status: 'Active',
      isActive: true,
      displayOrder: 1,
      sortOrder: 1,
      redirect_type: 'Category',
      redirect_target: 'Medical Equipment',
      open_in: 'Same Tab',
      alt_text: 'Super Sale - Up to 30% Off Discount On Medical Equipment',
      image_url: '/images/category_banner_medical_equipment.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      name: 'Everyday Pharmacy & Medicines Deal',
      position: 'MIDDLE',
      status: 'Active',
      isActive: true,
      displayOrder: 1,
      sortOrder: 1,
      redirect_type: 'Category',
      redirect_target: 'Medicines',
      open_in: 'Same Tab',
      alt_text: 'Special Offer - Save 20% on Prescription & Essential Medicines',
      image_url: '/images/category_banner_pharmacy_sale.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      name: 'Complete Wellness & Diagnostic Checkups',
      position: 'BOTTOM',
      status: 'Active',
      isActive: true,
      displayOrder: 1,
      sortOrder: 1,
      redirect_type: 'Category',
      redirect_target: 'Personal Care',
      open_in: 'Same Tab',
      alt_text: 'Health Checkup & Personal Care - Verified Healthcare Deals',
      image_url: '/images/category_banner_wellness_care.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log('Inserting new medical category banners...');
  const { data: inserted, error: insError } = await supabase
    .from('banners')
    .insert(newBanners)
    .select();

  if (insError) {
    console.error('Error inserting category banners:', insError);
  } else {
    console.log(`Successfully added ${inserted?.length || 3} category banners across TOP, MIDDLE, and BOTTOM positions!`);
  }
}

main();

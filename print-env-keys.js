require('dotenv').config({ path: '.env.local' });
console.log('ENV keys:', Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('DATA') || k.includes('URL')));

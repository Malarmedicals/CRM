-- Run this in your Supabase SQL Editor to add missing CRM columns to your existing ecommerce tables

-- Orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Prescriptions table
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in-stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compliance JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS medical_info JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Banners table (New table required by CRM)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    image TEXT NOT NULL,
    "mobileImage" TEXT,
    link TEXT,
    "seoDescription" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    category TEXT,
    "categoryTag" TEXT,
    "showCategoryTag" BOOLEAN DEFAULT false,
    "priceDisplay" TEXT,
    description TEXT,
    "seoTitle" TEXT,
    "linkProductId" TEXT,
    "bannerType" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Script to forcefully add missing columns safely
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS redirect_type TEXT DEFAULT 'Internal Page';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS open_in TEXT DEFAULT 'Same Tab';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS redirect_target TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS image_url TEXT;

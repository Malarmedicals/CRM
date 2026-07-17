-- Create the banners storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Inserts" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Deletes" ON storage.objects;

-- Allow public read access to the banners bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banners');

-- Allow all uploads/updates for the CRM in the local environment
CREATE POLICY "Allow All Inserts" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow All Updates" 
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'banners');

CREATE POLICY "Allow All Deletes" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'banners');

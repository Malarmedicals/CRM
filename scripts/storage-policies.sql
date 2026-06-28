-- Run this in your Supabase SQL Editor to allow image uploads to the products bucket

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the products bucket for reading and writing (or you can restrict to authenticated users)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Allow public insert access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow public update access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

CREATE POLICY "Allow public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');

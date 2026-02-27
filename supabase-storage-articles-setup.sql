-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Enable RLS for article-images bucket
CREATE POLICY "Anyone can view article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

-- Admins can upload article images
CREATE POLICY "Admins can upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images' AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admins can update article images
CREATE POLICY "Admins can update article images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'article-images' AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admins can delete article images
CREATE POLICY "Admins can delete article images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'article-images' AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

COMMENT ON TABLE storage.buckets IS 'Storage bucket for AI-generated article images';

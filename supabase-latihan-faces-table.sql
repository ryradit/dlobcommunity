-- Create table to store face detection data for latihan images
CREATE TABLE IF NOT EXISTS latihan_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL UNIQUE,
  image_title TEXT,
  face_count INTEGER DEFAULT 0,
  face_data JSONB, -- Store face bounding boxes and landmarks
  face_embeddings VECTOR(1280), -- Store face embeddings for similarity search
  processed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX idx_latihan_faces_image_id ON latihan_faces(image_id);
CREATE INDEX idx_latihan_faces_face_count ON latihan_faces(face_count);
CREATE INDEX idx_latihan_faces_processed_at ON latihan_faces(processed_at);

-- Grant permissions
GRANT ALL ON latihan_faces TO authenticated;
GRANT ALL ON latihan_faces TO service_role;

-- Add comments
COMMENT ON TABLE latihan_faces IS 'Stores face detection data for images in the latihan folder. Used for face-based filtering and searching.';
COMMENT ON COLUMN latihan_faces.face_data IS 'JSON array of face objects with bounding boxes and landmarks from Google Vision API';
COMMENT ON COLUMN latihan_faces.face_embeddings IS 'Vector embeddings of the faces for similarity search';
COMMENT ON COLUMN latihan_faces.face_count IS 'Number of faces detected in the image';

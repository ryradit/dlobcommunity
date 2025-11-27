-- Add OCR Notes table
CREATE TABLE admin_match_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    processed_text TEXT NOT NULL,
    match_id UUID REFERENCES matches(id),
    shuttlecock_count INTEGER,
    ocr_confidence DECIMAL(5,2),
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_ocr_data JSONB -- Store complete OCR response for debugging
);

-- Enable RLS
ALTER TABLE admin_match_notes ENABLE ROW LEVEL SECURITY;

-- Admin policy
CREATE POLICY "Admins can manage match notes" ON admin_match_notes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Update trigger
CREATE TRIGGER update_admin_match_notes_updated_at 
    BEFORE UPDATE ON admin_match_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
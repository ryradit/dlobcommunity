-- Article Generation Queue Table
CREATE TABLE article_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin Info
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  admin_name TEXT NOT NULL,
  
  -- Generation Info
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Queue Position
  position INTEGER,
  
  -- Progress Tracking
  progress_percent INTEGER DEFAULT 0,
  current_step TEXT,
  
  -- Result
  article_id UUID REFERENCES articles(id),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Estimated completion
  estimated_completion_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_queue_status ON article_generation_queue(status);
CREATE INDEX idx_queue_admin ON article_generation_queue(admin_id);
CREATE INDEX idx_queue_created ON article_generation_queue(created_at);
CREATE INDEX idx_queue_position ON article_generation_queue(position);

-- Enable RLS
ALTER TABLE article_generation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can see their own queue items and all pending items
CREATE POLICY "Admins can view their queue items"
  ON article_generation_queue FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admins can insert their own queue items
CREATE POLICY "Admins can create queue items"
  ON article_generation_queue FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- System can update queue items (for processing)
CREATE POLICY "System can update queue items"
  ON article_generation_queue FOR UPDATE
  USING (true);

-- Function to get next pending job
CREATE OR REPLACE FUNCTION get_next_queue_job()
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  SELECT id INTO job_id
  FROM article_generation_queue
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF job_id IS NOT NULL THEN
    UPDATE article_generation_queue
    SET 
      status = 'processing',
      started_at = NOW(),
      position = 0
    WHERE id = job_id;
  END IF;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS VOID AS $$
BEGIN
  WITH numbered_queue AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_position
    FROM article_generation_queue
    WHERE status = 'pending'
  )
  UPDATE article_generation_queue q
  SET position = nq.new_position
  FROM numbered_queue nq
  WHERE q.id = nq.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update positions
CREATE OR REPLACE FUNCTION trigger_update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_queue_positions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_positions_after_insert
  AFTER INSERT ON article_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_queue_positions();

CREATE TRIGGER update_positions_after_update
  AFTER UPDATE OF status ON article_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_queue_positions();

COMMENT ON TABLE article_generation_queue IS 'Queue for AI article generation to prevent concurrent generation conflicts';

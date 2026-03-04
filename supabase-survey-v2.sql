-- DLOB Survey V2 — pre-built adaptive questionnaire
-- Drop old survey tables if you want a clean slate (optional)
-- DROP TABLE IF EXISTS survey_answers, survey_submissions CASCADE;

CREATE TABLE IF NOT EXISTS survey_submissions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name   text,
  is_anonymous  boolean DEFAULT false,
  started_at    timestamptz DEFAULT now(),
  completed_at  timestamptz,
  answers       jsonb DEFAULT '{}'::jsonb,  -- { questionId: answer }
  qa_history    jsonb                       -- [{ id, section, sectionLabel, question, answer }]
);

CREATE INDEX IF NOT EXISTS survey_submissions_member_idx ON survey_submissions(member_id);
CREATE INDEX IF NOT EXISTS survey_submissions_completed_idx ON survey_submissions(completed_at);

-- RLS
ALTER TABLE survey_submissions ENABLE ROW LEVEL SECURITY;

-- Members can insert their own, read their own
CREATE POLICY "Members insert own submission"
  ON survey_submissions FOR INSERT
  WITH CHECK (auth.uid() = member_id OR member_id IS NULL);

CREATE POLICY "Members read own submission"
  ON survey_submissions FOR SELECT
  USING (auth.uid() = member_id OR is_anonymous = true);

-- Service role bypasses RLS automatically (for admin reads)

-- Create email_verifications table for storing verification tokens
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT email_verifications_user_id_key UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own verification tokens
CREATE POLICY "Users can view own verification tokens"
  ON public.email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all verification tokens
CREATE POLICY "Service role can manage all verification tokens"
  ON public.email_verifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- Clean up expired tokens automatically (run daily via cron or manually)
CREATE OR REPLACE FUNCTION clean_expired_verification_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < NOW();
END;
$$;

-- Comment on table and columns
COMMENT ON TABLE public.email_verifications IS 'Stores email verification tokens for user registration';
COMMENT ON COLUMN public.email_verifications.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.email_verifications.token IS 'Unique verification token';
COMMENT ON COLUMN public.email_verifications.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN public.email_verifications.created_at IS 'Token creation timestamp';

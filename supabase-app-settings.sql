-- App-wide settings key-value store
-- Run this once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only service role (API routes) can read/write
DROP POLICY IF EXISTS "Service role full access" ON app_settings;
CREATE POLICY "Service role full access" ON app_settings
  FOR ALL USING (true);

-- Seed default values
INSERT INTO app_settings (key, value)
VALUES ('wa_notifications_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('email_notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('bank_accounts', '{"holderName":"Septian Dwiyo Rifalda","banks":[{"name":"Permata Bank","number":"9937 296 220"},{"name":"Jenius","number":"90012823396"},{"name":"Mandiri","number":"1700 1093 5998 56"},{"name":"BNI","number":"0389 125635"},{"name":"Blu (BCA Digital)","number":"0022 2208 9889"},{"name":"BCA","number":"5871 788 087"}],"ewallets":[{"name":"DANA","number":"0821 1113 4140"},{"name":"Gopay","number":"0812 7073 272"},{"name":"ShopeePay","number":"0821 1113 4140"}]}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('qris_image_url', '')
ON CONFLICT (key) DO NOTHING;

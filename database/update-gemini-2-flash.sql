-- Update DLOB AI to use Gemini 2.0 Flash
-- Migration script to update existing chat_messages table

-- Update existing records to reflect the new AI model
UPDATE chat_messages 
SET ai_model = 'gemini-2.0-flash' 
WHERE ai_model = 'gemini-pro' OR ai_model IS NULL;

-- Update the default value for future records
ALTER TABLE chat_messages 
ALTER COLUMN ai_model SET DEFAULT 'gemini-2.0-flash';

-- Add comment to track the migration
COMMENT ON COLUMN chat_messages.ai_model IS 'AI model used for generating responses. Updated to gemini-2.0-flash on 2025-10-25';

-- Verify the changes
SELECT 
    ai_model, 
    COUNT(*) as message_count,
    MIN(created_at) as first_message,
    MAX(created_at) as latest_message
FROM chat_messages 
GROUP BY ai_model
ORDER BY latest_message DESC;
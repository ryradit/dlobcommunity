-- Fix the check_plan_completion trigger function to allow plans to be stopped or archived.
-- Execute this SQL in your Supabase SQL Editor to apply the fix.

CREATE OR REPLACE FUNCTION check_plan_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress_percentage >= 100 THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();
  ELSIF NEW.status IN ('stopped', 'stop', 'abandoned', 'paused') THEN
    -- Keep the stopped/stop/abandoned/paused status as is
    IF NEW.status IN ('stopped', 'stop', 'abandoned') AND NEW.completed_at IS NULL THEN
      NEW.completed_at := NOW();
    END IF;
  ELSE
    NEW.status := 'active';
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

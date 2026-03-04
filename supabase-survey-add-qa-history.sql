-- Migration: add qa_history column to survey_submissions
-- Run this in Supabase SQL Editor if you already created the table from supabase-survey-v2.sql

ALTER TABLE survey_submissions
  ADD COLUMN IF NOT EXISTS qa_history jsonb;

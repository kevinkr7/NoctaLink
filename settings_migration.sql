-- ==============================================================================
-- NOCTALINK — SETTINGS MIGRATION
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Add initialization_completed to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS initialization_completed BOOLEAN DEFAULT FALSE;

-- 2. Mark existing users who have questionnaire answers as already initialized
UPDATE public.user_profiles up
SET initialization_completed = TRUE
WHERE EXISTS (
  SELECT 1 FROM public.questionnaire_answers qa
  WHERE qa.user_id = up.id
);

-- 3. Ensure avatars storage bucket exists (run manually in Supabase Dashboard > Storage if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

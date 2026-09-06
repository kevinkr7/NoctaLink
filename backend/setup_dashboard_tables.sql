-- setup_dashboard_tables.sql
-- Run this in the Supabase SQL Editor

-- 1. Create cognitive_sessions table (since it's missing)
CREATE TABLE IF NOT EXISTS public.cognitive_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    duration NUMERIC,
    task_type TEXT,
    load_average NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cognitive_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own cognitive_sessions" ON public.cognitive_sessions;
CREATE POLICY "Users can insert their own cognitive_sessions" ON public.cognitive_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own cognitive_sessions" ON public.cognitive_sessions;
CREATE POLICY "Users can view their own cognitive_sessions" ON public.cognitive_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own cognitive_sessions" ON public.cognitive_sessions;
CREATE POLICY "Users can update their own cognitive_sessions" ON public.cognitive_sessions FOR UPDATE USING (auth.uid() = user_id);

-- 2. Update existing sleep_recommendations table
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS recommendation_date DATE;
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS insight TEXT;
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS confidence NUMERIC;
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS recovery_score NUMERIC;
ALTER TABLE public.sleep_recommendations ADD COLUMN IF NOT EXISTS impact_area TEXT;

ALTER TABLE public.sleep_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own sleep_recommendations" ON public.sleep_recommendations;
CREATE POLICY "Users can view their own sleep_recommendations" ON public.sleep_recommendations FOR SELECT USING (auth.uid() = user_id);

-- 3. Update existing eeg_features table
ALTER TABLE public.eeg_features ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE public.eeg_features ADD COLUMN IF NOT EXISTS rem_percentage NUMERIC;
ALTER TABLE public.eeg_features ADD COLUMN IF NOT EXISTS deep_sleep_percentage NUMERIC;

-- ==============================================================================
-- NOCTALINK — COGNITIVE SESSIONS MIGRATION
-- Run this in your Supabase SQL Editor
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cognitive_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_name TEXT,
    cognitive_load_score NUMERIC,
    attention_stability NUMERIC,
    fatigue_score NUMERIC,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.cognitive_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cognitive_sessions"
    ON public.cognitive_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_user_id
    ON cognitive_sessions(user_id, started_at DESC);

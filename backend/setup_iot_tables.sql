-- setup_iot_tables.sql
-- Run this in the Supabase SQL Editor

-- 1. Create eeg_features table
CREATE TABLE IF NOT EXISTS public.eeg_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    session_type TEXT NOT NULL,
    signal_quality NUMERIC NOT NULL,
    
    delta_power NUMERIC,
    theta_power NUMERIC,
    alpha_power NUMERIC,
    beta_power NUMERIC,
    gamma_power NUMERIC,
    
    relative_delta NUMERIC,
    relative_theta NUMERIC,
    relative_alpha NUMERIC,
    relative_beta NUMERIC,
    relative_gamma NUMERIC,
    
    theta_alpha_ratio NUMERIC,
    beta_alpha_ratio NUMERIC,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user and time
CREATE INDEX IF NOT EXISTS idx_eeg_features_user_time ON public.eeg_features(user_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.eeg_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own eeg_features"
ON public.eeg_features FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own eeg_features"
ON public.eeg_features FOR SELECT
USING (auth.uid() = user_id);


-- 2. Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL,
    prediction_value NUMERIC NOT NULL,
    confidence NUMERIC,
    model_version TEXT NOT NULL,
    input_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent predictions
CREATE INDEX IF NOT EXISTS idx_predictions_user_type_time ON public.predictions(user_id, prediction_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own predictions"
ON public.predictions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own predictions"
ON public.predictions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create cognitive_twin table (if it doesn't exist, we'll store the latest state here)
CREATE TABLE IF NOT EXISTS public.cognitive_twin_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    cognitive_readiness NUMERIC,
    workload_score NUMERIC,
    fatigue_score NUMERIC,
    attention_score NUMERIC,
    memory_score NUMERIC,
    recovery_state TEXT,
    confidence NUMERIC,
    model_version TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cognitive_twin_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cognitive twin state"
ON public.cognitive_twin_state FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cognitive twin state"
ON public.cognitive_twin_state FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cognitive twin state"
ON public.cognitive_twin_state FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


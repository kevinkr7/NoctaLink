-- ==============================================================================
-- NOCTALINK SUPABASE SCHEMA
-- ==============================================================================

-- 1. User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    profile_picture TEXT,
    date_of_birth DATE,
    gender TEXT,
    occupation TEXT,
    country TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Medical History Table
CREATE TABLE medical_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    anxiety BOOLEAN DEFAULT FALSE,
    adhd BOOLEAN DEFAULT FALSE,
    depression BOOLEAN DEFAULT FALSE,
    sleep_apnea BOOLEAN DEFAULT FALSE,
    diabetes BOOLEAN DEFAULT FALSE,
    hypertension BOOLEAN DEFAULT FALSE,
    migraine BOOLEAN DEFAULT FALSE,
    medications TEXT,
    notes TEXT
);

-- 3. Lifestyle Profile Table
CREATE TABLE lifestyle_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    average_bedtime TIME,
    average_wakeup TIME,
    average_sleep_hours NUMERIC,
    exercise_frequency TEXT,
    coffee_per_day INTEGER,
    alcohol TEXT,
    smoking BOOLEAN,
    water_intake_litres NUMERIC
);

-- 4. Questionnaire Answers Table (Key-Value)
CREATE TABLE questionnaire_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    question_key TEXT,
    answer TEXT,
    answered_at TIMESTAMP DEFAULT NOW()
);

-- 5. Daily Checkins Table
CREATE TABLE daily_checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    date DATE,
    mood TEXT,
    energy_level INTEGER,
    sleepiness INTEGER,
    stress_level INTEGER,
    workload INTEGER,
    study_hours NUMERIC,
    coding_hours NUMERIC,
    exercise_minutes INTEGER,
    caffeine INTEGER,
    notes TEXT
);

-- 6. Sleep Sessions Table
CREATE TABLE sleep_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    sleep_date DATE,
    bedtime TIME,
    wakeup_time TIME,
    sleep_duration NUMERIC,
    sleep_quality_score NUMERIC,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. EEG Features Table
CREATE TABLE eeg_features (
    id BIGSERIAL PRIMARY KEY,
    sleep_session_id BIGINT REFERENCES sleep_sessions(id),
    delta_power NUMERIC,
    theta_power NUMERIC,
    alpha_power NUMERIC,
    beta_power NUMERIC,
    gamma_power NUMERIC,
    spindle_density NUMERIC,
    rem_percentage NUMERIC,
    deep_sleep_percentage NUMERIC,
    signal_quality NUMERIC
);

-- 8. Predictions Table
CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    prediction_date TIMESTAMP DEFAULT NOW(),
    attention_score NUMERIC,
    memory_score NUMERIC,
    fatigue_score NUMERIC,
    cognitive_readiness NUMERIC,
    confidence NUMERIC
);

-- 9. Sleep Recommendations Table
CREATE TABLE sleep_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    recommendation_date TIMESTAMP DEFAULT NOW(),
    recommended_sleep_hours NUMERIC,
    recovery_score NUMERIC,
    explanation TEXT
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eeg_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Rest of Policies (General rule: user_id must match auth.uid())
CREATE POLICY "Users can manage own medical_history" ON public.medical_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lifestyle_profile" ON public.lifestyle_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own questionnaire_answers" ON public.questionnaire_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own checkins" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sleep sessions" ON public.sleep_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own predictions" ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sleep_recommendations" ON public.sleep_recommendations FOR SELECT USING (auth.uid() = user_id);

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "@/components/StarField";
import { BrainModel } from "@/components/three/BrainModel";
import { Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Answers = {
  medical_conditions: string[];
  typical_bedtime: string;
  typical_wakeup_time: string;
  average_sleep_duration: string;
  exercise_frequency: string;
  water_intake: string;
  smoking: string;
  alcohol: string;
  coffee_intake: string;
  lose_focus_frequency: string;
  mental_exhaustion: string;
  learning_style: string;
  study_hours: string;
  coding_hours: string;
  screen_time: string;
  stress_level: string;
  workload: string;
  waking_refreshment: string;
  waking_during_sleep: string;
  naps: string;
  goals: string[];
};

const SECTIONS = [
  {
    title: "Medical Background",
    questions: [
      {
        id: "medical_conditions",
        question: "Do you have any of the following? (Select all that apply)",
        type: "multi-select",
        options: ["None", "Anxiety", "ADHD", "Depression", "Sleep Apnea", "Diabetes", "Hypertension", "Migraine", "Other"]
      }
    ]
  },
  {
    title: "Lifestyle",
    questions: [
      { id: "typical_bedtime", question: "Typical bedtime", type: "time" },
      { id: "typical_wakeup_time", question: "Typical wake-up time", type: "time" },
      { id: "average_sleep_duration", question: "Average sleep duration (hours)", type: "number" },
      { id: "exercise_frequency", question: "Exercise frequency", type: "select", options: ["Never", "1-2 times/week", "3-4 times/week", "5+ times/week"] },
      { id: "water_intake", question: "Water intake", type: "select", options: ["Low", "Moderate", "High"] },
      { id: "smoking", question: "Smoking", type: "select", options: ["Never", "Occasionally", "Regularly"] },
      { id: "alcohol", question: "Alcohol", type: "select", options: ["Never", "Occasionally", "Regularly"] },
      { id: "coffee_intake", question: "Coffee intake", type: "select", options: ["None", "1-2 cups/day", "3-4 cups/day", "5+ cups/day"] },
    ]
  },
  {
    title: "Cognitive Behaviour",
    questions: [
      { id: "lose_focus_frequency", question: "How often do you lose focus?", type: "select", options: ["Rarely", "Sometimes", "Often", "Always"] },
      { id: "mental_exhaustion", question: "How mentally exhausted do you feel after studying?", type: "select", options: ["Very Low", "Low", "Moderate", "High", "Extreme"] },
      { id: "learning_style", question: "Preferred learning style", type: "select", options: ["Visual", "Reading", "Listening", "Practical", "Mixed"] },
    ]
  },
  {
    title: "Daily Routine",
    questions: [
      { id: "study_hours", question: "Typical study hours per day", type: "number" },
      { id: "coding_hours", question: "Typical coding hours per day", type: "number" },
      { id: "screen_time", question: "Average screen time (hours)", type: "number" },
      { id: "stress_level", question: "Average stress level", type: "select", options: ["Low", "Moderate", "High", "Severe"] },
      { id: "workload", question: "Typical workload", type: "select", options: ["Light", "Manageable", "Heavy", "Overwhelming"] },
    ]
  },
  {
    title: "Sleep Behaviour",
    questions: [
      { id: "waking_refreshment", question: "How refreshed do you usually feel after waking?", type: "select", options: ["Very Refreshed", "Refreshed", "Neutral", "Tired", "Very Tired"] },
      { id: "waking_during_sleep", question: "How often do you wake during sleep?", type: "select", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: "naps", question: "Do you usually take naps?", type: "select", options: ["Never", "Sometimes", "Frequently"] },
    ]
  },
  {
    title: "Goals",
    questions: [
      {
        id: "goals",
        question: "What would you like NoctaLink to improve? (Select all that apply)",
        type: "multi-select",
        options: ["Sleep", "Memory", "Attention", "Mental Performance", "Fatigue", "Stress", "Overall Health"]
      }
    ]
  }
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    medical_conditions: [],
    typical_bedtime: "",
    typical_wakeup_time: "",
    average_sleep_duration: "",
    exercise_frequency: "",
    water_intake: "",
    smoking: "",
    alcohol: "",
    coffee_intake: "",
    lose_focus_frequency: "",
    mental_exhaustion: "",
    learning_style: "",
    study_hours: "",
    coding_hours: "",
    screen_time: "",
    stress_level: "",
    workload: "",
    waking_refreshment: "",
    waking_during_sleep: "",
    naps: "",
    goals: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (id: keyof Answers, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleMultiSelect = (id: keyof Answers, option: string) => {
    setAnswers((prev) => {
      const currentArray = (prev[id] as string[]) || [];
      
      // Handle "None" logic for medical conditions
      if (option === "None") {
        return { ...prev, [id]: ["None"] };
      }
      
      let newArray = currentArray.includes(option)
        ? currentArray.filter(i => i !== option)
        : [...currentArray.filter(i => i !== "None"), option];
        
      return { ...prev, [id]: newArray };
    });
  };

  const nextSection = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      submitAnswers();
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("You must be logged in to save your profile.");
      }

      const userId = authData.user.id;

      // --- 0. Fallback: Ensure user_profiles exists (for old test accounts) ---
      const { data: profile } = await supabase.from('user_profiles').select('id').eq('id', userId).maybeSingle();
      if (!profile) {
        await supabase.from('user_profiles').insert({
          id: userId,
          full_name: authData.user.user_metadata?.full_name || "User",
        });
      }

      // --- 1. medical_history ---
      const m = answers.medical_conditions;
      const medicalPayload = {
        user_id: userId,
        anxiety: m.includes("Anxiety"),
        adhd: m.includes("ADHD"),
        depression: m.includes("Depression"),
        sleep_apnea: m.includes("Sleep Apnea"),
        diabetes: m.includes("Diabetes"),
        hypertension: m.includes("Hypertension"),
        migraine: m.includes("Migraine"),
        medications: m.includes("Other") ? "User selected Other" : null,
      };

      const { error: medError } = await supabase.from('medical_history').insert([medicalPayload]);
      if (medError) throw medError;

      // --- 2. lifestyle_profile ---
      // Map qualitative to quantitative where schema demands
      let waterLitres = null;
      if (answers.water_intake === "Low") waterLitres = 1.0;
      if (answers.water_intake === "Moderate") waterLitres = 2.0;
      if (answers.water_intake === "High") waterLitres = 3.5;

      let coffeeCount = null;
      if (answers.coffee_intake === "None") coffeeCount = 0;
      if (answers.coffee_intake === "1-2 cups/day") coffeeCount = 1;
      if (answers.coffee_intake === "3-4 cups/day") coffeeCount = 3;
      if (answers.coffee_intake === "5+ cups/day") coffeeCount = 5;

      const lifestylePayload = {
        user_id: userId,
        average_bedtime: answers.typical_bedtime ? answers.typical_bedtime + ":00" : null,
        average_wakeup: answers.typical_wakeup_time ? answers.typical_wakeup_time + ":00" : null,
        average_sleep_hours: answers.average_sleep_duration ? parseFloat(answers.average_sleep_duration) : null,
        exercise_frequency: answers.exercise_frequency || null,
        coffee_per_day: coffeeCount,
        alcohol: answers.alcohol || null,
        smoking: answers.smoking === "Never" ? false : answers.smoking ? true : null,
        water_intake_litres: waterLitres,
      };

      const { error: lifeError } = await supabase.from('lifestyle_profile').insert([lifestylePayload]);
      if (lifeError) throw lifeError;

      // --- 3. questionnaire_answers (Key-Value mappings) ---
      const kvData = [
        { question_key: 'lose_focus_frequency', answer: answers.lose_focus_frequency },
        { question_key: 'mental_exhaustion', answer: answers.mental_exhaustion },
        { question_key: 'learning_style', answer: answers.learning_style },
        { question_key: 'study_hours', answer: answers.study_hours },
        { question_key: 'coding_hours', answer: answers.coding_hours },
        { question_key: 'screen_time', answer: answers.screen_time },
        { question_key: 'stress_level', answer: answers.stress_level },
        { question_key: 'workload', answer: answers.workload },
        { question_key: 'waking_refreshment', answer: answers.waking_refreshment },
        { question_key: 'waking_during_sleep', answer: answers.waking_during_sleep },
        { question_key: 'naps', answer: answers.naps },
        { question_key: 'goals', answer: answers.goals.join(', ') },
      ]
      .filter(item => item.answer && item.answer.trim() !== '')
      .map(item => ({
        user_id: userId,
        question_key: item.question_key,
        answer: String(item.answer)
      }));

      if (kvData.length > 0) {
        const { error: qaError } = await supabase.from('questionnaire_answers').insert(kvData);
        if (qaError) throw qaError;
      }

      // Mark cognitive twin initialization as complete
      await supabase
        .from('user_profiles')
        .update({ initialization_completed: true })
        .eq('id', userId);

      // Notify navbar to refresh
      window.dispatchEvent(new CustomEvent('profile-updated'));

      setIsComplete(true);
      
      // Wait for animation to finish before redirecting
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 4500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save answers.");
      setIsSubmitting(false);
    }
  };

  const progress = ((currentSection + 1) / SECTIONS.length) * 100;
  const estimatedTime = SECTIONS.length - currentSection;

  if (isComplete) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground">
        <StarField count={150} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--violet)_25%,transparent),transparent_60%)]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center"
        >
          <div className="relative h-64 w-64 md:h-96 md:w-96">
            <div className="absolute inset-0 rounded-full bg-[var(--violet)]/20 blur-3xl" />
            <BrainModel className="relative h-full w-full animate-float-y" />
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 font-display text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60"
          >
            Cognitive Twin Successfully Initialized
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="mt-4 text-muted-foreground"
          >
            Routing you to your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const section = SECTIONS[currentSection];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground py-12 px-4">
      <StarField count={50} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--violet)_10%,transparent),transparent_60%)]" />

      <div className="z-10 w-full max-w-3xl">
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-semibold tracking-wider"
          >
            Cognitive Twin Initialization
          </motion.h1>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
              <motion.div 
                className="h-full bg-[var(--violet)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Est. time: ~{estimatedTime} min
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="glass-strong violet-glow rounded-3xl p-8 md:p-12"
          >
            <h2 className="mb-8 font-display text-2xl font-medium text-white/90">
              {section.title}
            </h2>

            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {section.questions.map((q) => (
                <div key={q.id}>
                  <label className="mb-3 block text-sm tracking-wide text-muted-foreground">
                    {q.question}
                  </label>
                  
                  {q.type === "time" && (
                    <input
                      type="time"
                      value={(answers[q.id as keyof Answers] as string) || ""}
                      onChange={(e) => handleInputChange(q.id as keyof Answers, e.target.value)}
                      className="w-full md:w-1/2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  )}

                  {q.type === "number" && (
                    <input
                      type="number"
                      step="0.5"
                      value={(answers[q.id as keyof Answers] as string) || ""}
                      onChange={(e) => handleInputChange(q.id as keyof Answers, e.target.value)}
                      className="w-full md:w-1/2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  )}

                  {q.type === "select" && q.options && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleInputChange(q.id as keyof Answers, opt)}
                          className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                            answers[q.id as keyof Answers] === opt
                              ? "border-[var(--violet)] bg-[color-mix(in_oklab,var(--violet)_20%,transparent)] text-white"
                              : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/30 hover:bg-white/[0.05]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "multi-select" && q.options && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {q.options.map((opt) => {
                        const isSelected = (answers[q.id as keyof Answers] as string[]).includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleMultiSelect(q.id as keyof Answers, opt)}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                              isSelected
                                ? "border-[var(--violet)] bg-[color-mix(in_oklab,var(--violet)_20%,transparent)] text-white"
                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/30 hover:bg-white/[0.05]"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="h-4 w-4 text-[var(--violet)]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-between">
              <button
                type="button"
                onClick={previousSection}
                disabled={currentSection === 0 || isSubmitting}
                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/5 disabled:opacity-30"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextSection}
                disabled={isSubmitting}
                className="rounded-xl bg-white px-8 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {isSubmitting ? "Initializing..." : currentSection === SECTIONS.length - 1 ? "Initialize Twin" : "Continue"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

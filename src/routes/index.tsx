import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureCards } from "@/components/FeatureCards";
import { MoonOrbit } from "@/components/three/MoonOrbit";
import { Architecture } from "@/components/Architecture";
import { Footer } from "@/components/Footer";
import { StarField } from "@/components/StarField";
import { AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoctaLink — AI Cognitive Twin for Sleep & Cognition" },
      { name: "description", content: "NoctaLink links sleep EEG biomarkers with cognitive performance through an AI-driven Cognitive Twin platform." },
      { property: "og:title", content: "NoctaLink — AI Cognitive Twin Platform" },
      { property: "og:description", content: "Linking Sleep and Cognition Through Intelligence." },
    ],
  }),
  component: Landing,
});

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative mx-auto w-full max-w-6xl px-6 py-28 snap-start min-h-screen flex flex-col justify-center">
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-[var(--violet-glow)]"
        >
          {eyebrow}
        </motion.p>
      )}
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl"
        >
          {title}
        </motion.h2>
      )}
      {children}
    </section>
  );
}

function Landing() {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerLink, setBannerLink] = useState("/onboarding");
  const [bannerText, setBannerText] = useState("Your Cognitive Twin Initialization is incomplete.");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // First check if they completed profile setup
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && !profile.gender) {
          setShowBanner(true);
          setBannerLink("/profile-setup");
          setBannerText("Your profile setup is incomplete.");
          return;
        }

        // If a user has a row in medical_history, they've completed the initialization
        const { data, error } = await supabase
          .from('medical_history')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!data && !error) {
          setShowBanner(true);
          setBannerLink("/onboarding");
          setBannerText("Your Cognitive Twin Initialization is incomplete.");
        }
      }
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Listen for custom event from Navbar dropdown to hide the blimp
    const handleDropdownChange = (e: any) => {
      setDropdownOpen(e.detail?.open || false);
    };
    window.addEventListener('nav-dropdown-change', handleDropdownChange);
    return () => window.removeEventListener('nav-dropdown-change', handleDropdownChange);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AnimatePresence>
        {showBanner && !dropdownOpen && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="fixed top-24 right-6 z-[60] flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[var(--violet)]/95 to-[#9d4edd]/95 backdrop-blur-xl p-5 text-white shadow-[0_8px_32px_rgba(139,92,246,0.4)] w-80 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-white shrink-0 mt-0.5 drop-shadow-md" />
              <p className="text-sm font-medium leading-relaxed drop-shadow-md">{bannerText}</p>
            </div>
            <Link
              to={bannerLink}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[var(--violet)] transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Continue Setup
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      
      <Hero />

      {/* About */}
      <Section id="research" eyebrow="About NoctaLink" title="A Cognitive Twin for the era of intelligent neuroscience.">
        <div className="grid gap-8 md:grid-cols-2">
          <p className="text-lg leading-relaxed text-muted-foreground">
            NoctaLink analyzes sleep EEG biomarkers and predicts cognitive performance through a
            neuroscience-driven modeling engine. It transforms a night of brain activity into a
            personalized, evolving digital twin of your cognition.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { k: "32+", v: "EEG biomarkers" },
              { k: "4", v: "Sleep stages mapped" },
              { k: "ms", v: "Real-time inference" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl glass p-5 text-center">
                <div className="font-display text-3xl font-semibold text-gradient">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section id="features" eyebrow="Core Capabilities" title="Three pillars powering the Cognitive Twin.">
        <FeatureCards />
      </Section>

      {/* Moon Orbit */}
      <section className="relative overflow-hidden py-28 snap-start min-h-screen flex flex-col justify-center">
        <StarField count={80} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--violet)_18%,transparent),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <MoonOrbit className="mx-auto h-[480px] w-full max-w-3xl" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-6 max-w-2xl text-center font-display text-2xl tracking-tight text-foreground/90 md:text-3xl"
          >
            Transforming Sleep Signals into Cognitive Intelligence
          </motion.p>
        </div>
      </section>

      {/* Architecture */}
      <Section id="prototype" eyebrow="System Architecture" title="How NoctaLink Works">
        <Architecture />
      </Section>

      <div className="snap-end">
        <Footer />
      </div>
    </div>
  );
}

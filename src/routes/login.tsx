import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { StarField } from "@/components/StarField";
import { BrainModel } from "@/components/three/BrainModel";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — NoctaLink" },
      { name: "description", content: "Sign in to your NoctaLink Cognitive Twin account." },
    ],
  }),
  component: LoginPage,
});

function Ribbons() {
  return (
    <svg className="absolute -bottom-10 -left-10 h-[70%] w-[70%]" viewBox="0 0 600 600" fill="none">
      <defs>
        <linearGradient id="r1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="r2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0" />
          <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <motion.path
          key={i}
          d={`M -50 ${380 + i * 30} C 120 ${260 + i * 20}, 320 ${480 + i * 10}, 650 ${300 + i * 25}`}
          stroke={i % 2 ? "url(#r2)" : "url(#r1)"}
          strokeWidth={1.2}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, delay: i * 0.3, ease: "easeOut" }}
        />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.circle
          key={`s${i}`}
          r={1.2}
          fill="#fff"
          initial={{ cx: -20, cy: 380 + (i % 4) * 30 }}
          animate={{ cx: 650, cy: 300 + (i % 4) * 25 }}
          transition={{
            duration: 6 + (i % 5),
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground"
    >
      {/* Left immersive panel */}
      <div className="relative hidden w-3/5 overflow-hidden lg:block">
        <StarField count={150} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,color-mix(in_oklab,var(--violet)_22%,transparent),transparent_60%)]" />
        <Ribbons />

        <div className="relative z-10 flex h-full flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="font-display text-6xl font-bold tracking-[0.25em]">
              NOCTA<span className="text-gradient">LINK</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">Linking Sleep and Cognition</p>
          </motion.div>

          <div className="absolute right-10 top-1/2 h-56 w-56 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full bg-[var(--violet)]/25 blur-3xl" />
            <BrainModel className="relative h-full w-full animate-float-y" />
            <div
              aria-hidden
              className="absolute -bottom-4 left-1/2 h-3 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,#a78bfa,transparent_70%)]"
            />
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-2/5">
        <StarField count={40} className="lg:hidden" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-3xl glass-strong violet-glow p-10"
        >
          <Link to="/" className="mb-8 inline-block text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h2 className="font-display text-3xl font-semibold">Welcome Back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Continue your cognitive journey.</p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@noctalink.ai"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--violet)] focus:outline-none focus:ring-2 focus:ring-[var(--violet)]/30"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground">Password</label>
                <a href="#" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--violet)] focus:outline-none focus:ring-2 focus:ring-[var(--violet)]/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New researcher?{" "}
            <Link to="/register" className="text-foreground underline-offset-4 hover:underline">Create account</Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

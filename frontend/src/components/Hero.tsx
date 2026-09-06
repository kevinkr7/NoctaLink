import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useRef } from "react";
import { BrainModel } from "./three/BrainModel";
import { StarField } from "./StarField";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const moonOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const brainY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const brainScale = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
  const starsY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24 snap-start">
      {/* atmospheric backdrops */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_oklab,var(--violet)_25%,transparent),transparent_60%)]" />
      <motion.div style={{ y: starsY }} className="absolute inset-0">
        <StarField count={180} />
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        {/* Brain */}
        <motion.div
          style={{ y: brainY, scale: brainScale }}
          className="relative h-[260px] w-[260px] md:h-[340px] md:w-[340px]"
        >
          <div className="absolute inset-0 rounded-full bg-[var(--violet)]/30 blur-3xl" />
          <BrainModel className="relative h-full w-full animate-float-y" />
        </motion.div>

        {/* Moon platform */}
        <motion.div
          style={{ y: moonY, opacity: moonOpacity }}
          className="relative -mt-10 w-full max-w-4xl"
        >
          <div className="relative mx-auto h-[220px] w-full md:h-[280px]">
            <svg viewBox="0 0 800 220" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="moonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e9e4f5" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.35" />
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="6" /></filter>
              </defs>
              <path
                d="M 0 220 Q 400 -60 800 220 Q 400 160 0 220 Z"
                fill="url(#moonGrad)"
                opacity="0.25"
                filter="url(#glow)"
              />
              <path
                d="M 0 220 Q 400 -60 800 220"
                stroke="url(#moonGrad)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 40 220 Q 400 -30 760 220"
                stroke="#a78bfa"
                strokeOpacity="0.4"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <div className="absolute inset-x-0 -top-4 flex justify-center">
              <h1
                className="text-6xl font-bold tracking-[0.25em] md:text-8xl"
                style={{ fontFamily: "'TrenchThin', sans-serif" }}
              >
                NOCTA<span className="text-gradient">LINK</span>
              </h1>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-muted-foreground"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </motion.div>
    </section>
  );
}

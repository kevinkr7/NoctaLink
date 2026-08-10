import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "@/components/StarField";
import { BrainModel } from "@/components/three/BrainModel";
import { createServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

// --- SERVER FUNCTIONS (Executed on the server via RPC) ---

export const sendRegistrationOtp = createServerFn({ method: 'POST' })
  .validator((data: { email: string; name: string }) => data)
  .handler(async ({ data }) => {
    const { email, name } = data;
    
    // Dynamic imports keep server code out of the client bundle
    const { createClient } = await import('@supabase/supabase-js');
    const nodemailer = (await import('nodemailer')).default;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const smtpHost = process.env.SMTP_HOST || "";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpFrom = process.env.SMTP_FROM || "noreply@noctalink.com";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .upsert({ email, otp, created_at: new Date().toISOString() }, { onConflict: 'email' });

    if (dbError) throw new Error("Failed to generate OTP. Ensure otp_verifications table exists.");

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: "Your NoctaLink Verification Code",
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff; border-radius: 12px; border: 1px solid #333;">
            <h2 style="color: #8b5cf6; text-align: center;">NoctaLink Registration</h2>
            <p style="font-size: 16px; color: #e5e5e5;">Hello ${name},</p>
            <p style="font-size: 16px; color: #e5e5e5;">Your 6-digit verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ffffff; background-color: #1a1a1a; padding: 15px 30px; border-radius: 8px; border: 1px solid #8b5cf6;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #a3a3a3; text-align: center;">This code will expire in 10 minutes.</p>
          </div>
        `
      });
      
      return { success: true };
    } catch (emailError: any) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }
  });


export const verifyAndCreateUser = createServerFn({ method: 'POST' })
  .validator((data: { email: string; otp: string; name: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { email, otp, name, password } = data;
    
    // Dynamic import
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !otpRecord) throw new Error("No pending registration found for this email.");
    if (otpRecord.otp !== otp) throw new Error("Invalid verification code.");

    const createdAt = new Date(otpRecord.created_at).getTime();
    if (Date.now() - createdAt > 10 * 60 * 1000) throw new Error("Verification code has expired.");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user.");

    await supabaseAdmin.from('user_profiles').insert({ id: authData.user.id, full_name: name });
    await supabaseAdmin.from('otp_verifications').delete().eq('email', email);

    return { success: true };
  });

// --- CLIENT COMPONENT ---

function RegisterPage() {
  const navigate = useNavigate();

  // Flow State
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // 1. Trigger custom server-side OTP sending
      await sendRegistrationOtp({
        data: {
          email: formData.email,
          name: formData.fullName,
        }
      });
      
      // Move to OTP step to verify email
      setStep("otp");

    } catch (err: any) {
      console.error("Custom OTP Sending Error:", err);
      let errMsg = "An unexpected error occurred during registration.";
      if (typeof err === 'string') {
        errMsg = err;
      } else if (err?.message && typeof err.message === 'string' && err.message !== '{}') {
        errMsg = err.message;
      } else if (err?.msg) {
        errMsg = err.msg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 2. Verify OTP and Create User (bypassing Supabase Confirmations!)
      await verifyAndCreateUser({
        data: {
          email: formData.email,
          otp: otp,
          name: formData.fullName,
          password: formData.password
        }
      });

      // 3. The user is created and confirmed on the backend. Log them in!
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // 4. Navigate to Profile Setup
      navigate({ to: "/profile-setup" });

    } catch (err: any) {
      setError(err.message || "Invalid OTP or verification failed.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground py-12"
    >
      <StarField count={80} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--violet)_15%,transparent),transparent_50%)]" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass-strong violet-glow rounded-3xl p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="font-display text-3xl font-bold tracking-tight">Create Account</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Join NoctaLink to begin your cognitive journey.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Full Name *</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                    >
                      {loading ? "Creating Account..." : "Continue to Verification"}
                    </button>
                  </div>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
                    Log in instead
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-8 h-40 w-40">
                  <div className="absolute inset-0 rounded-full bg-[var(--violet)]/20 blur-xl" />
                  <BrainModel className="relative h-full w-full animate-float-y" />
                </div>
                
                <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Verify Your Email</h2>
                <p className="mb-8 text-center text-sm text-muted-foreground">
                  We've sent a 6-digit code to <strong>{formData.email}</strong>.
                  <br />Please enter it below to verify your account.
                </p>

                <form onSubmit={handleOtpSubmit} className="w-full max-w-sm space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground text-center">Authentication Code</label>
                    <input
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg font-bold focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Account"
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    disabled={loading}
                    className="w-full text-center text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    Back to registration
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

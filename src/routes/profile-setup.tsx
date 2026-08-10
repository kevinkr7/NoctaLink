import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "@/components/StarField";
import { Upload, X, Camera } from "lucide-react";

export const Route = createFileRoute("/profile-setup")({
  component: ProfileSetupPage,
});

function ProfileSetupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    dob: "",
    gender: "",
    height: "",
    weight: "",
    occupation: "",
    country: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("You must be logged in to set up your profile.");
      }

      const userId = authData.user.id;
      let profileImageUrl = null;

      // 1. Upload Profile Image (if provided)
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          profileImageUrl = publicUrlData.publicUrl;
        } else {
          console.error("Image upload error:", uploadError);
        }
      }

      // 2. Update existing Profile Row in user_profiles
      const updatePayload: any = {
        date_of_birth: formData.dob || null,
        gender: formData.gender || null,
        height_cm: formData.height ? parseFloat(formData.height) : null,
        weight_kg: formData.weight ? parseFloat(formData.weight) : null,
        occupation: formData.occupation || null,
        country: formData.country || null,
        updated_at: new Date().toISOString(),
      };

      if (profileImageUrl) {
        updatePayload.profile_picture = profileImageUrl;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // 3. Navigate to Onboarding
      navigate({ to: "/onboarding" });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile details.");
    } finally {
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
        className="relative z-10 w-full max-w-2xl px-4"
      >
        <div className="glass-strong violet-glow rounded-3xl p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">Complete Your Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tell us a bit more about yourself before we initialize your twin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-white/20 bg-white/5 transition hover:border-[var(--violet)]">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                    >
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:text-foreground"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] uppercase tracking-wider">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Occupation</label>
                  <input
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Country</label>
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm focus:border-[var(--violet)] focus:outline-none focus:ring-1 focus:ring-[var(--violet)]/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {loading ? "Saving Profile..." : "Start Initialization"}
              </button>
            </div>
            
            <div className="text-center mt-4">
               <button 
                  type="button" 
                  onClick={() => navigate({ to: "/onboarding" })}
                  className="text-xs text-muted-foreground hover:text-white transition-colors"
               >
                 Skip for now
               </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

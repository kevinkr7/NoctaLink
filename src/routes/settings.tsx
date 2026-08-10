import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  User,
  Heart,
  Coffee,
  Moon,
  Settings,
  Shield,
  Trash2,
  LogOut,
  Key,
  Mail,
  Upload,
  X,
  Check,
  Loader,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { StarField } from "@/components/StarField";
import { Navbar } from "@/components/Navbar";
import { ImageCropModal } from "@/components/settings/ImageCropModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NoctaLink" },
      { name: "description", content: "Manage your NoctaLink account and preferences." },
    ],
  }),
  component: SettingsPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

type Section =
  | "profile"
  | "personal"
  | "medical"
  | "lifestyle"
  | "sleep"
  | "account"
  | "security";

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile Picture", icon: Camera },
  { id: "personal", label: "Personal Information", icon: User },
  { id: "medical", label: "Medical Information", icon: Heart },
  { id: "lifestyle", label: "Lifestyle", icon: Coffee },
  { id: "sleep", label: "Sleep Preferences", icon: Moon },
  { id: "account", label: "Account", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bangladesh", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
  "Czech Republic", "Denmark", "Egypt", "Ethiopia", "Finland", "France",
  "Germany", "Ghana", "Greece", "Hungary", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Vietnam",
];

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition focus:border-[var(--violet)]/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--violet)]/30";

const labelCls = "block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1.5";

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
  disabled,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
    >
      {saving ? (
        <><Loader className="h-4 w-4 animate-spin" /> Saving…</>
      ) : saved ? (
        <><Check className="h-4 w-4 text-green-600" /> Saved!</>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

// ─── Section: Profile Picture ─────────────────────────────────────────────────

function ProfilePictureSection({
  userId,
  avatarUrl,
  onAvatarChange,
}: {
  userId: string;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropSave = async (blob: Blob) => {
    setUploading(true);
    setError(null);
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      await supabase
        .from("user_profiles")
        .update({ profile_picture: publicUrl })
        .eq("id", userId);

      onAvatarChange(publicUrl);
      setCropSrc(null);
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (err: any) {
      setError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await supabase
        .from("user_profiles")
        .update({ profile_picture: null })
        .eq("id", userId);
      onAvatarChange(null);
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (err: any) {
      setError(err?.message ?? "Failed to remove picture.");
    } finally {
      setRemoving(false);
    }
  };

  const initials = userId.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold">Profile Picture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo that will appear across NoctaLink.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="h-32 w-32 rounded-full border-2 border-[var(--violet)]/30 bg-white/5 overflow-hidden shadow-lg">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="font-display text-3xl font-semibold text-white/40">
                  {initials}
                </span>
              </div>
            )}
          </div>
          {/* Camera overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/70 backdrop-blur-sm text-white transition hover:bg-[var(--violet)]/20 hover:border-[var(--violet)]/40"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3 flex flex-col items-start">
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. Max 10 MB.
          </p>
          <button
            id="upload-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-[var(--violet)]/30 bg-[var(--violet)]/10 px-4 py-2.5 text-sm font-medium text-[var(--violet-glow)] transition hover:bg-[var(--violet)]/20"
          >
            <Upload className="h-4 w-4" />
            Upload New Picture
          </button>
          {avatarUrl && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {removing ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Remove Picture
            </button>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}

// ─── Section: Personal Information ───────────────────────────────────────────

interface PersonalData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  occupation: string;
  country: string;
}

function PersonalSection({
  userId,
  initial,
  onDirtyChange,
}: {
  userId: string;
  initial: PersonalData;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<PersonalData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const set = (field: keyof PersonalData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("user_profiles")
        .update({
          full_name: form.full_name || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          occupation: form.occupation || null,
          country: form.country || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (err) throw err;
      setSaved(true);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Personal Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile details used for personalized insights.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label="Full Name">
          <input
            className={inputCls}
            value={form.full_name}
            onChange={set("full_name")}
            placeholder="Your full name"
          />
        </FieldRow>
        <FieldRow label="Date of Birth">
          <input
            type="date"
            className={`${inputCls} [color-scheme:dark]`}
            value={form.date_of_birth}
            onChange={set("date_of_birth")}
          />
        </FieldRow>
        <FieldRow label="Gender">
          <select className={inputCls} value={form.gender} onChange={set("gender")}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </FieldRow>
        <FieldRow label="Occupation">
          <input
            className={inputCls}
            value={form.occupation}
            onChange={set("occupation")}
            placeholder="e.g. Software Engineer"
          />
        </FieldRow>
        <FieldRow label="Height (cm)">
          <input
            type="number"
            className={inputCls}
            value={form.height_cm}
            onChange={set("height_cm")}
            placeholder="170"
            min={0}
            max={300}
          />
        </FieldRow>
        <FieldRow label="Weight (kg)">
          <input
            type="number"
            className={inputCls}
            value={form.weight_kg}
            onChange={set("weight_kg")}
            placeholder="70"
            min={0}
            max={500}
          />
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow label="Country">
            <select className={inputCls} value={form.country} onChange={set("country")}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FieldRow>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} disabled={!dirty} />
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}

// ─── Section: Medical Information ────────────────────────────────────────────

interface MedicalData {
  id: number | null;
  anxiety: boolean;
  adhd: boolean;
  depression: boolean;
  sleep_apnea: boolean;
  diabetes: boolean;
  hypertension: boolean;
  migraine: boolean;
  medications: string;
  notes: string;
}

const MEDICAL_TOGGLES: { key: keyof MedicalData; label: string }[] = [
  { key: "anxiety", label: "Anxiety" },
  { key: "adhd", label: "ADHD" },
  { key: "depression", label: "Depression" },
  { key: "sleep_apnea", label: "Sleep Apnea" },
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "migraine", label: "Migraine" },
];

function MedicalSection({
  userId,
  initial,
  onDirtyChange,
}: {
  userId: string;
  initial: MedicalData;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<MedicalData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const toggleCondition = (key: keyof MedicalData) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: !prev[key as keyof MedicalData] }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        user_id: userId,
        anxiety: form.anxiety,
        adhd: form.adhd,
        depression: form.depression,
        sleep_apnea: form.sleep_apnea,
        diabetes: form.diabetes,
        hypertension: form.hypertension,
        migraine: form.migraine,
        medications: form.medications || null,
        notes: form.notes || null,
      };

      if (form.id) {
        const { error: err } = await supabase
          .from("medical_history")
          .update(payload)
          .eq("id", form.id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from("medical_history")
          .insert(payload)
          .select("id")
          .single();
        if (err) throw err;
        setForm((prev) => ({ ...prev, id: data.id }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Medical Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used to personalize cognitive predictions. Stored securely.
        </p>
      </div>

      <div>
        <label className={labelCls}>Conditions</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {MEDICAL_TOGGLES.map(({ key, label }) => {
            const active = form[key] as boolean;
            return (
              <button
                key={key}
                id={`medical-${key}`}
                onClick={() => toggleCondition(key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "border-[var(--violet)]/40 bg-[var(--violet)]/15 text-[var(--violet-glow)]"
                    : "border-white/8 bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:text-white/70"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition ${
                    active
                      ? "border-[var(--violet-glow)] bg-[var(--violet)]"
                      : "border-white/20"
                  }`}
                >
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <FieldRow label="Current Medications">
        <textarea
          className={`${inputCls} min-h-[80px] resize-none`}
          value={form.medications}
          onChange={(e) => { setSaved(false); setForm((p) => ({ ...p, medications: e.target.value })); }}
          placeholder="List any medications you are currently taking…"
        />
      </FieldRow>

      <FieldRow label="Other Notes">
        <textarea
          className={`${inputCls} min-h-[80px] resize-none`}
          value={form.notes}
          onChange={(e) => { setSaved(false); setForm((p) => ({ ...p, notes: e.target.value })); }}
          placeholder="Any other relevant medical information…"
        />
      </FieldRow>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} disabled={!dirty} />
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}

// ─── Section: Lifestyle ───────────────────────────────────────────────────────

interface LifestyleData {
  id: number | null;
  exercise_frequency: string;
  coffee_per_day: string;
  alcohol: string;
  smoking: boolean;
  water_intake_litres: string;
}

function LifestyleSection({
  userId,
  initial,
  onDirtyChange,
}: {
  userId: string;
  initial: LifestyleData;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<LifestyleData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const set =
    (field: keyof LifestyleData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setSaved(false);
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        user_id: userId,
        exercise_frequency: form.exercise_frequency || null,
        coffee_per_day: form.coffee_per_day ? Number(form.coffee_per_day) : null,
        alcohol: form.alcohol || null,
        smoking: form.smoking,
        water_intake_litres: form.water_intake_litres ? Number(form.water_intake_litres) : null,
      };

      if (form.id) {
        const { error: err } = await supabase.from("lifestyle_profile").update(payload).eq("id", form.id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.from("lifestyle_profile").insert(payload).select("id").single();
        if (err) throw err;
        setForm((prev) => ({ ...prev, id: data.id }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Lifestyle</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Habits that influence your cognitive performance and recovery.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label="Exercise Frequency">
          <select className={inputCls} value={form.exercise_frequency} onChange={set("exercise_frequency")}>
            <option value="">Select frequency</option>
            <option value="sedentary">Sedentary (rarely/never)</option>
            <option value="light">Light (1–2×/week)</option>
            <option value="moderate">Moderate (3–4×/week)</option>
            <option value="active">Active (5–6×/week)</option>
            <option value="very-active">Very Active (daily)</option>
          </select>
        </FieldRow>

        <FieldRow label="Coffee Cups per Day">
          <input
            type="number"
            className={inputCls}
            value={form.coffee_per_day}
            onChange={set("coffee_per_day")}
            placeholder="0"
            min={0}
            max={20}
          />
        </FieldRow>

        <FieldRow label="Alcohol Consumption">
          <select className={inputCls} value={form.alcohol} onChange={set("alcohol")}>
            <option value="">Select</option>
            <option value="none">None</option>
            <option value="occasional">Occasional (social)</option>
            <option value="moderate">Moderate (1–3×/week)</option>
            <option value="heavy">Heavy (daily)</option>
          </select>
        </FieldRow>

        <FieldRow label="Water Intake (litres/day)">
          <input
            type="number"
            step="0.5"
            className={inputCls}
            value={form.water_intake_litres}
            onChange={set("water_intake_litres")}
            placeholder="2.0"
            min={0}
            max={10}
          />
        </FieldRow>

        <div className="sm:col-span-2">
          <label className={labelCls}>Smoking</label>
          <div className="flex gap-3">
            {(["No", "Yes"] as const).map((opt) => {
              const val = opt === "Yes";
              const active = form.smoking === val;
              return (
                <button
                  key={opt}
                  onClick={() => { setSaved(false); setForm((p) => ({ ...p, smoking: val })); }}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-[var(--violet)]/40 bg-[var(--violet)]/15 text-[var(--violet-glow)]"
                      : "border-white/8 bg-white/[0.02] text-muted-foreground hover:border-white/15"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} disabled={!dirty} />
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}

// ─── Section: Sleep Preferences ──────────────────────────────────────────────

interface SleepData {
  id: number | null;
  average_bedtime: string;
  average_wakeup: string;
  average_sleep_hours: string;
}

function SleepSection({
  userId,
  initial,
  onDirtyChange,
}: {
  userId: string;
  initial: SleepData;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState<SleepData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const set =
    (field: keyof SleepData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        user_id: userId,
        average_bedtime: form.average_bedtime || null,
        average_wakeup: form.average_wakeup || null,
        average_sleep_hours: form.average_sleep_hours ? Number(form.average_sleep_hours) : null,
      };

      if (form.id) {
        const { error: err } = await supabase.from("lifestyle_profile").update(payload).eq("id", form.id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.from("lifestyle_profile").insert(payload).select("id").single();
        if (err) throw err;
        setForm((prev) => ({ ...prev, id: data.id }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Sleep Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your typical sleep schedule used to calibrate your cognitive twin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label="Average Bedtime">
          <input
            type="time"
            className={`${inputCls} [color-scheme:dark]`}
            value={form.average_bedtime}
            onChange={set("average_bedtime")}
          />
        </FieldRow>

        <FieldRow label="Average Wake-up Time">
          <input
            type="time"
            className={`${inputCls} [color-scheme:dark]`}
            value={form.average_wakeup}
            onChange={set("average_wakeup")}
          />
        </FieldRow>

        <div className="sm:col-span-2">
          <FieldRow label="Average Sleep Duration (hours)">
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={form.average_sleep_hours}
              onChange={set("average_sleep_hours")}
              placeholder="7.5"
              min={0}
              max={24}
            />
          </FieldRow>
        </div>
      </div>

      {/* Visual sleep window preview */}
      {form.average_bedtime && form.average_wakeup && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sleep Window Preview</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--violet-glow)]">{form.average_bedtime}</div>
              <div className="text-xs text-muted-foreground">Bedtime</div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--violet)]/60 via-[var(--violet-glow)]/40 to-transparent" />
            <Moon className="h-4 w-4 text-[var(--violet-glow)]" />
            <div className="flex-1 h-px bg-gradient-to-l from-[var(--violet)]/60 via-[var(--violet-glow)]/40 to-transparent" />
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{form.average_wakeup}</div>
              <div className="text-xs text-muted-foreground">Wake-up</div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton onClick={save} saving={saving} saved={saved} disabled={!dirty} />
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}

// ─── Section: Account ─────────────────────────────────────────────────────────

function AccountSection({
  email,
  createdAt,
  lastSignIn,
  onDeleteAccount,
}: {
  email: string | null;
  createdAt: string | null;
  lastSignIn: string | null;
  onDeleteAccount: () => void;
}) {
  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Account details and data management.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { label: "Email Address", value: email ?? "—", icon: Mail },
          { label: "Account Created", value: fmt(createdAt), icon: Settings },
          { label: "Last Sign In", value: fmt(lastSignIn), icon: Settings },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <Icon className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm text-white/80 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="font-semibold text-sm text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Deleting your account is permanent and cannot be undone. All your data including cognitive twin data, sleep recordings, and predictions will be permanently erased.
        </p>
        <button
          id="delete-account-btn"
          onClick={onDeleteAccount}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </button>
      </div>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection({
  email,
  onLogout,
}: {
  email: string | null;
  onLogout: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setSavingPw(true);
    setPwError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) {
      setPwError(e?.message ?? "Failed to update password.");
    } finally {
      setSavingPw(false);
    }
  };

  const sendReset = async () => {
    if (!email) return;
    setSendingReset(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and account access.
        </p>
      </div>

      {/* Change Password */}
      <div className="hud-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-[var(--violet-glow)]" />
          <h3 className="font-semibold text-sm">Change Password</h3>
        </div>

        <FieldRow label="New Password">
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className={`${inputCls} pr-10`}
              value={newPassword}
              onChange={(e) => { setPwSaved(false); setPwError(null); setNewPassword(e.target.value); }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FieldRow>

        <FieldRow label="Confirm Password">
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className={`${inputCls} pr-10`}
              value={confirmPassword}
              onChange={(e) => { setPwError(null); setConfirmPassword(e.target.value); }}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FieldRow>

        {pwError && <p className="text-sm text-red-400">{pwError}</p>}
        {pwSaved && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            Password updated successfully.
          </div>
        )}

        <button
          onClick={changePassword}
          disabled={savingPw || !newPassword || !confirmPassword}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {savingPw ? (
            <><Loader className="h-4 w-4 animate-spin" /> Updating…</>
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      {/* Forgot / Reset */}
      <div className="hud-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground/60" />
          <h3 className="font-semibold text-sm">Forgot Password</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Send a password reset link to your email address:{" "}
          <span className="text-white/70">{email ?? "—"}</span>
        </p>
        {resetSent ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            Reset link sent! Check your inbox.
          </div>
        ) : (
          <button
            onClick={sendReset}
            disabled={sendingReset}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/8 hover:text-white disabled:opacity-50"
          >
            {sendingReset ? (
              <><Loader className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              "Send Reset Email"
            )}
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="hud-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-muted-foreground/60" />
          <h3 className="font-semibold text-sm">Sign Out</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Sign out of your NoctaLink account on this device.
        </p>
        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

function SettingsPage() {
  const navigate = useNavigate();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Section
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dirty state per section
  const [dirtyMap, setDirtyMap] = useState<Record<Section, boolean>>({
    profile: false, personal: false, medical: false,
    lifestyle: false, sleep: false, account: false, security: false,
  });

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Personal data
  const [personalData, setPersonalData] = useState<PersonalData>({
    full_name: "", date_of_birth: "", gender: "",
    height_cm: "", weight_kg: "", occupation: "", country: "",
  });

  // Medical data
  const [medicalData, setMedicalData] = useState<MedicalData>({
    id: null, anxiety: false, adhd: false, depression: false,
    sleep_apnea: false, diabetes: false, hypertension: false,
    migraine: false, medications: "", notes: "",
  });

  // Lifestyle data
  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({
    id: null, exercise_frequency: "", coffee_per_day: "",
    alcohol: "", smoking: false, water_intake_litres: "",
  });

  // Sleep data
  const [sleepData, setSleepData] = useState<SleepData>({
    id: null, average_bedtime: "", average_wakeup: "", average_sleep_hours: "",
  });

  const [dataLoading, setDataLoading] = useState(true);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);
      setCreatedAt(session.user.created_at ?? null);
      setLastSignIn(session.user.last_sign_in_at ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // ── Load all profile data ───────────────────────────────────────────────────
  const loadData = useCallback(async (uid: string) => {
    setDataLoading(true);
    try {
      // user_profiles
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, date_of_birth, gender, height_cm, weight_kg, occupation, country, profile_picture")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setAvatarUrl(profile.profile_picture ?? null);
        setPersonalData({
          full_name: profile.full_name ?? "",
          date_of_birth: profile.date_of_birth ?? "",
          gender: profile.gender ?? "",
          height_cm: profile.height_cm?.toString() ?? "",
          weight_kg: profile.weight_kg?.toString() ?? "",
          occupation: profile.occupation ?? "",
          country: profile.country ?? "",
        });
      }

      // medical_history
      const { data: med } = await supabase
        .from("medical_history")
        .select("*")
        .eq("user_id", uid)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (med) {
        setMedicalData({
          id: med.id, anxiety: med.anxiety ?? false, adhd: med.adhd ?? false,
          depression: med.depression ?? false, sleep_apnea: med.sleep_apnea ?? false,
          diabetes: med.diabetes ?? false, hypertension: med.hypertension ?? false,
          migraine: med.migraine ?? false, medications: med.medications ?? "",
          notes: med.notes ?? "",
        });
      }

      // lifestyle_profile
      const { data: ls } = await supabase
        .from("lifestyle_profile")
        .select("*")
        .eq("user_id", uid)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ls) {
        const lsId = ls.id;
        setLifestyleData({
          id: lsId, exercise_frequency: ls.exercise_frequency ?? "",
          coffee_per_day: ls.coffee_per_day?.toString() ?? "",
          alcohol: ls.alcohol ?? "", smoking: ls.smoking ?? false,
          water_intake_litres: ls.water_intake_litres?.toString() ?? "",
        });
        setSleepData({
          id: lsId, average_bedtime: ls.average_bedtime ?? "",
          average_wakeup: ls.average_wakeup ?? "",
          average_sleep_hours: ls.average_sleep_hours?.toString() ?? "",
        });
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadData(userId);
  }, [userId, loadData]);

  // ── Unsaved-changes browser guard ───────────────────────────────────────────
  useEffect(() => {
    const isDirty = Object.values(dirtyMap).some(Boolean);
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyMap]);

  const markDirty = (section: Section) => (dirty: boolean) =>
    setDirtyMap((prev) => ({ ...prev, [section]: dirty }));

  // ── Section switching with unsaved guard ────────────────────────────────────
  const handleSectionClick = (id: Section) => {
    if (dirtyMap[activeSection] && id !== activeSection) {
      setPendingSection(id);
      setShowUnsavedDialog(true);
    } else {
      setActiveSection(id);
    }
  };

  const handleDiscard = () => {
    setDirtyMap((prev) => ({ ...prev, [activeSection]: false }));
    if (pendingSection) setActiveSection(pendingSection);
    setPendingSection(null);
    setShowUnsavedDialog(false);
    // Reload data to reset forms
    if (userId) loadData(userId);
  };

  const handleStay = () => {
    setPendingSection(null);
    setShowUnsavedDialog(false);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      // Delete profile data first (cascade handles the rest via FK)
      await supabase.from("user_profiles").delete().eq("id", userId);
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <StarField count={40} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--violet)_6%,transparent),transparent_55%)]" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">NoctaLink</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Account <span className="text-gradient">Settings</span>
          </h1>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Left Sidebar ─────────────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="w-full shrink-0 lg:w-64 xl:w-72"
          >
            <div className="glass-strong rounded-2xl p-2 space-y-0.5 lg:sticky lg:top-24">
              {/* Profile preview */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-white/5">
                <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white/50">
                        {userId?.slice(0, 2).toUpperCase() ?? "U"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">
                    {personalData.full_name || "Your Profile"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                </div>
              </div>

              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                const dirty = dirtyMap[id];
                return (
                  <button
                    key={id}
                    id={`settings-nav-${id}`}
                    onClick={() => handleSectionClick(id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all ${
                      active
                        ? "bg-[var(--violet)]/15 border border-[var(--violet)]/25 text-[var(--violet-glow)]"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[var(--violet-glow)]" : ""}`} />
                    <span className="flex-1">{label}</span>
                    {dirty && (
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.aside>

          {/* ── Right Content ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <div className="glass-strong rounded-2xl p-6 sm:p-8 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeSection === "profile" && userId && (
                    <ProfilePictureSection
                      userId={userId}
                      avatarUrl={avatarUrl}
                      onAvatarChange={setAvatarUrl}
                    />
                  )}

                  {activeSection === "personal" && userId && (
                    <PersonalSection
                      userId={userId}
                      initial={personalData}
                      onDirtyChange={markDirty("personal")}
                    />
                  )}

                  {activeSection === "medical" && userId && (
                    <MedicalSection
                      userId={userId}
                      initial={medicalData}
                      onDirtyChange={markDirty("medical")}
                    />
                  )}

                  {activeSection === "lifestyle" && userId && (
                    <LifestyleSection
                      userId={userId}
                      initial={lifestyleData}
                      onDirtyChange={markDirty("lifestyle")}
                    />
                  )}

                  {activeSection === "sleep" && userId && (
                    <SleepSection
                      userId={userId}
                      initial={sleepData}
                      onDirtyChange={markDirty("sleep")}
                    />
                  )}

                  {activeSection === "account" && (
                    <AccountSection
                      email={userEmail}
                      createdAt={createdAt}
                      lastSignIn={lastSignIn}
                      onDeleteAccount={() => setShowDeleteDialog(true)}
                    />
                  )}

                  {activeSection === "security" && (
                    <SecuritySection
                      email={userEmail}
                      onLogout={handleLogout}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Unsaved changes dialog ──────────────────────────────────────────── */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="glass-strong border-white/10 bg-black/80 rounded-2xl text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg">Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You have unsaved changes in this section. Would you like to discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={handleStay}
              className="rounded-xl border-white/10 bg-white/[0.04] text-sm hover:bg-white/8"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="rounded-xl bg-white text-sm font-semibold text-black hover:bg-white/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete account confirmation ─────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-strong border-white/10 bg-black/80 rounded-2xl text-foreground">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <AlertDialogTitle className="font-display text-lg">Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              This action is <strong className="text-white/80">permanent and irreversible</strong>. All your cognitive twin data, sleep recordings, EEG biomarkers, and predictions will be permanently deleted. Your account cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 bg-white/[0.04] text-sm hover:bg-white/8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <><Loader className="h-4 w-4 animate-spin" /> Deleting…</>
              ) : (
                "Yes, Delete My Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

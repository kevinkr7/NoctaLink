import { Link, useNavigate } from "@tanstack/react-router";
import { Home, AlertTriangle, ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Initialization toast ────────────────────────────────────────────────────

function InitializationToast({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="fixed left-4 top-[76px] z-50 w-80 max-w-[calc(100vw-2rem)]"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="glass-strong rounded-2xl border border-red-500/25 bg-black/70 p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 border border-red-500/25 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">
              Complete Cognitive Twin Initialization
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Please complete your Cognitive Twin Initialization before accessing your Dashboard.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-white transition ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              onDismiss();
              navigate({ to: "/onboarding" });
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
          >
            Go to Initialization
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-white/8 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [initCompleted, setInitCompleted] = useState<boolean | null>(null);
  const [showInitToast, setShowInitToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchProfileData = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("profile_picture, initialization_completed")
      .eq("id", userId)
      .maybeSingle();

    if (data?.profile_picture) setProfileImg(data.profile_picture);
    else setProfileImg(null);

    setInitCompleted(data?.initialization_completed ?? false);
  };

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfileData(session.user.id);
    });

    // Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        setProfileImg(null);
        setInitCompleted(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for profile updates dispatched from settings page
  useEffect(() => {
    const handler = () => {
      if (session?.user) fetchProfileData(session.user.id);
    };
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    // Block navigation if initialization is not complete
    if (initCompleted === false) {
      e.preventDefault();
      setShowInitToast(true);
      // Auto-dismiss after 6 seconds
      setTimeout(() => setShowInitToast(false), 6000);
    }
  };

  const showNotificationDot = session && initCompleted === false;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Initialization toast */}
      <AnimatePresence>
        {showInitToast && (
          <InitializationToast onDismiss={() => setShowInitToast(false)} />
        )}
      </AnimatePresence>

      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <nav
          className={`flex w-full max-w-6xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 ${
            scrolled ? "glass-strong violet-glow" : "glass"
          }`}
        >
          <Link
            to="/"
            aria-label="Home"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Link>

          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#research" className="transition hover:text-foreground">
              Research
            </a>
            <a href="#prototype" className="transition hover:text-foreground">
              Prototype
            </a>
          </div>

          {session ? (
            <DropdownMenu
              onOpenChange={(open) =>
                window.dispatchEvent(
                  new CustomEvent("nav-dropdown-change", { detail: { open } })
                )
              }
            >
              <DropdownMenuTrigger asChild>
                <button className="relative rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--violet)]">
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={profileImg || ""} alt="Profile" />
                    <AvatarFallback className="bg-white/5 text-xs">U</AvatarFallback>
                  </Avatar>

                  {/* Red notification dot */}
                  {showNotificationDot && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-red-500 pointer-events-auto">
                          <div className="absolute inset-0 rounded-full bg-red-400 animate-status-ping" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="rounded-lg border-white/10 bg-black/80 px-2.5 py-1.5 text-xs text-white backdrop-blur-md"
                      >
                        Initialization Pending
                      </TooltipContent>
                    </Tooltip>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl border-white/10 bg-black/80 backdrop-blur-md"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Dashboard — blocked if not initialized */}
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white rounded-xl">
                  <Link to="/dashboard" onClick={handleDashboardClick}>
                    <div className="flex items-center justify-between w-full">
                      <span>Dashboard</span>
                      {initCompleted === false && (
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>

                {/* Settings — now a real link */}
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white rounded-xl">
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled
                  className="opacity-50 rounded-xl"
                >
                  Notifications
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-xl"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-[var(--violet)] hover:bg-[color-mix(in_oklab,var(--violet)_18%,transparent)]"
            >
              Login
            </Link>
          )}
        </nav>
      </header>
    </TooltipProvider>
  );
}

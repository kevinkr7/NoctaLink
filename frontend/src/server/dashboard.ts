import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// Server-only: uses anon key (RLS enforces auth.uid())
// We get the session from the Authorization header passed by the client.
function getSupabaseServer(authToken?: string) {
  const url = process.env["VITE_SUPABASE_URL"] ?? "";
  const anonKey = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
  return createClient(url, anonKey, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  });
}

export const getActiveSessionFn = createServerFn({
  method: "GET",
})
  .validator((data: { token: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServer(data.token);

    const { data: session, error } = await supabase
      .from("cognitive_sessions")
      .select("*")
      .eq("user_id", data.userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table might not exist yet — return null gracefully
      return { session: null, error: error.message };
    }

    return { session, error: null };
  });

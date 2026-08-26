import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pbfxcabqqaboqejcgjkx.supabase.co";
// Browser builds must use Supabase's publishable (or legacy anon) key—never a
// service_role key. Prefer the publishable key when both are present.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error("Google sign-in is not configured. Set VITE_SUPABASE_ANON_KEY in the frontend deployment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase;

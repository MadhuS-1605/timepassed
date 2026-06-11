import { createClient } from "@supabase/supabase-js";

// The backend is OPTIONAL. If these env vars aren't set, `supabase` is null and
// the whole app keeps working fully on-device (local-first) — sign-in, sync and
// Pro purchase simply aren't offered. Set them in a .env file (see .env.example).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

// Optional account layer. Returns a null user when the backend isn't configured
// or nobody is signed in — the app works either way.
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = (email, password) =>
    supabase.auth.signUp({ email: email.trim(), password });
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email: email.trim(), password });
  const signOut = () => supabase.auth.signOut();

  return { user, loading, configured: supabaseConfigured, signUp, signIn, signOut };
}

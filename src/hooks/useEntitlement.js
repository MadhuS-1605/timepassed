import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// New users get a free trial of Pro features; after that they need to unlock Pro.
export const TRIAL_DAYS = 7;

function firstOpen() {
  let v = localStorage.getItem("first_open");
  if (!v) {
    v = new Date().toISOString();
    localStorage.setItem("first_open", v);
  }
  return new Date(v);
}

/**
 * Entitlement = real Pro (from the signed-in user's profile, cached locally) OR
 * an active free trial. `proEffective` is what feature-gates should check.
 */
export default function useEntitlement(user) {
  const [isPro, setIsPro] = useState(() => localStorage.getItem("is_pro") === "1");
  const [plan, setPlan] = useState(() => localStorage.getItem("pro_plan") || null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_pro, plan")
      .eq("id", user.id)
      .maybeSingle();
    const pro = !!data?.is_pro;
    setIsPro(pro);
    setPlan(data?.plan || null);
    localStorage.setItem("is_pro", pro ? "1" : "0");
    if (data?.plan) localStorage.setItem("pro_plan", data.plan);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Signing out clears the cached Pro flag.
  useEffect(() => {
    if (supabase && !user) {
      setIsPro(false);
      localStorage.setItem("is_pro", "0");
    }
  }, [user]);

  const trialEnd = new Date(firstOpen().getTime() + TRIAL_DAYS * 86400000);
  const isTrial = !isPro && new Date() < trialEnd;
  const daysLeftInTrial = Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000));

  return { isPro, plan, isTrial, daysLeftInTrial, proEffective: isPro || isTrial, refresh };
}

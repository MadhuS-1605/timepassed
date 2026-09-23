import { supabase } from "./supabase";

/**
 * Stripe Pro purchase: edge function creates a hosted Checkout Session
 * (server decides the price), we redirect there. The session's webhook
 * (not this redirect) is what actually grants Pro.
 */
export async function startStripeCheckout({ user, plan = "lifetime" }) {
  if (!supabase) throw new Error("Backend not configured.");
  if (!user) throw new Error("Sign in to upgrade.");

  const { data, error } = await supabase.functions.invoke("stripe-create-checkout-session", {
    body: { plan, returnUrl: window.location.origin + window.location.pathname },
  });
  if (error || !data?.url) throw new Error(error?.message || "Couldn't start checkout.");
  window.location.href = data.url;
}

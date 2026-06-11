import { supabase, RAZORPAY_KEY_ID } from "./supabase";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Razorpay checkout"));
    document.body.appendChild(s);
  });
}

/**
 * Full Pro purchase flow:
 *  1. edge function creates a Razorpay order (server decides the price)
 *  2. Razorpay Checkout collects payment
 *  3. edge function verifies the signature and flips the profile to Pro
 * Resolves { ok } / { ok:false, dismissed } / throws on setup errors.
 */
export async function startProCheckout({ user, plan = "lifetime", email, onSuccess, onError }) {
  if (!supabase) throw new Error("Backend not configured.");
  if (!RAZORPAY_KEY_ID) throw new Error("Razorpay key not configured.");
  if (!user) throw new Error("Sign in to upgrade.");

  const { data: order, error } = await supabase.functions.invoke("razorpay-create-order", {
    body: { plan },
  });
  if (error || !order?.id) throw new Error(error?.message || "Couldn't start checkout.");

  await loadCheckout();

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "TimePassed Pro",
      description: order.label || "Unlock TimePassed Pro",
      prefill: { email: email || user.email || "" },
      theme: { color: "#22c55e" },
      handler: async (resp) => {
        try {
          const { data, error: vErr } = await supabase.functions.invoke("razorpay-verify", {
            body: { ...resp, plan },
          });
          if (vErr || !data?.ok) throw new Error(vErr?.message || "Verification failed.");
          onSuccess?.(data);
          resolve({ ok: true });
        } catch (e) {
          onError?.(e);
          resolve({ ok: false, error: String(e?.message || e) });
        }
      },
      modal: { ondismiss: () => resolve({ ok: false, dismissed: true }) },
    });
    rzp.open();
  });
}

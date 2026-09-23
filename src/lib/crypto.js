import { supabase } from "./supabase";

/**
 * Crypto (USDC on Base) Pro purchase: edge function reserves a unique payment
 * amount and returns the receiving address. Pro is granted asynchronously by
 * the crypto-watcher cron once the on-chain transfer is matched — there's no
 * synchronous confirmation step here.
 */
export async function startCryptoCheckout({ user, plan = "lifetime" }) {
  if (!supabase) throw new Error("Backend not configured.");
  if (!user) throw new Error("Sign in to upgrade.");

  const { data, error } = await supabase.functions.invoke("crypto-create-request", {
    body: { plan },
  });
  if (error || !data?.address) throw new Error(error?.message || "Couldn't create payment request.");
  return data; // { id, address, amount, chain, plan, label }
}

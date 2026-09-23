// Reserves a USDC-on-Base payment request: a unique amount (base price + a
// few random micro-cents) that the watcher can later match to exactly this
// user without a memo field. Requires an authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, USD_PLANS } from "../_shared/cors.ts";

const RECEIVE_ADDRESS = () => Deno.env.get("USDC_RECEIVE_ADDRESS")!;
const MAX_ATTEMPTS = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const { plan = "lifetime" } = await req.json().catch(() => ({}));
    const cfg = USD_PLANS[plan];
    if (!cfg) return json({ error: "Unknown plan" }, 400);

    // Free up amounts from abandoned requests older than 2 hours.
    await supabase
      .from("crypto_payment_requests")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    const base = cfg.amount / 100;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const offsetMicros = Math.floor(Math.random() * 9999) + 1; // $0.000001–$0.009999
      const amount = Math.round((base + offsetMicros / 1e6) * 1e6) / 1e6;

      const { data, error } = await supabase
        .from("crypto_payment_requests")
        .insert({ user_id: user.id, plan, amount_usdc: amount })
        .select("id")
        .single();

      if (!error) {
        return json({
          id: data.id,
          address: RECEIVE_ADDRESS(),
          amount: amount.toFixed(6),
          chain: "Base",
          plan,
          label: cfg.label,
        });
      }
      // 23505 = unique_violation — amount already claimed, try another.
      if (error.code !== "23505") return json({ error: error.message }, 500);
    }
    return json({ error: "Couldn't reserve a payment amount, try again." }, 503);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

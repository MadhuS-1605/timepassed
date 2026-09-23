// Creates a Razorpay order for a Pro plan. The amount is decided here (server),
// never trusted from the client. Requires an authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, PLANS } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    // Identify the user from their JWT.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const { plan = "lifetime" } = await req.json().catch(() => ({}));
    const cfg = PLANS[plan];
    if (!cfg) return json({ error: "Unknown plan" }, 400);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const auth = btoa(`${keyId}:${keySecret}`);

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: cfg.amount,
        currency: cfg.currency,
        receipt: `tp_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: user.id, plan },
      }),
    });
    const order = await resp.json();
    if (!resp.ok) return json({ error: order?.error?.description || "Order failed" }, 502);

    return json({ id: order.id, amount: order.amount, currency: order.currency, plan, label: cfg.label });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

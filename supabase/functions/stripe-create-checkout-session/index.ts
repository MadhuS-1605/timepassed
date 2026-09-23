// Creates a Stripe Checkout Session for a Pro plan. Mirrors razorpay-create-order:
// price is decided server-side from USD_PLANS, never trusted from the client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, USD_PLANS } from "../_shared/cors.ts";

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

    const { plan = "lifetime", returnUrl } = await req.json().catch(() => ({}));
    const cfg = USD_PLANS[plan];
    if (!cfg) return json({ error: "Unknown plan" }, 400);

    const base = returnUrl || Deno.env.get("APP_URL") || "https://timepassed.wtf";
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(cfg.amount),
      "line_items[0][price_data][product_data][name]": cfg.label,
      success_url: `${base}?stripe=success`,
      cancel_url: `${base}?stripe=cancelled`,
      "metadata[user_id]": user.id,
      "metadata[plan]": plan,
      customer_email: user.email || "",
    });

    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")!}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const session = await resp.json();
    if (!resp.ok) return json({ error: session?.error?.message || "Checkout session failed" }, 502);

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

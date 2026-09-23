// Verifies a completed Razorpay payment and grants Pro. The signature check uses
// the key secret (server-only); the entitlement is written with the service-role
// key so it bypasses RLS (users cannot grant themselves Pro).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, hmacHex } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan = "lifetime" } =
      await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing payment fields" }, 400);
    }

    // Razorpay signs `${order_id}|${payment_id}` with the key secret.
    const expected = await hmacHex(
      Deno.env.get("RAZORPAY_KEY_SECRET")!,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );
    if (expected !== razorpay_signature) {
      return json({ ok: false, error: "Signature mismatch" }, 400);
    }

    // Grant Pro using the service-role key (bypasses RLS).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: upErr } = await admin.from("profiles").upsert({
      id: user.id,
      is_pro: true,
      plan,
      pro_since: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (upErr) return json({ ok: false, error: upErr.message }, 500);

    return json({ ok: true, plan });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
});

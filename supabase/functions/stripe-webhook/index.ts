// Stripe webhook: the authoritative Pro-grant path for Stripe payments (the
// success_url redirect alone isn't trustworthy — the browser can hit it
// without ever paying). Configure this URL in the Stripe dashboard for the
// checkout.session.completed event and set STRIPE_WEBHOOK_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyStripeSignature } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  try {
    const raw = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";
    const ok = await verifyStripeSignature(
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      raw,
      signature,
    );
    if (!ok) return new Response("invalid signature", { status: 400 });

    const event = JSON.parse(raw);
    if (event?.type !== "checkout.session.completed") {
      return new Response("ignored", { status: 200 });
    }

    const metadata = event?.data?.object?.metadata || {};
    const userId = metadata.user_id;
    const plan = metadata.plan || "lifetime";
    if (!userId) return new Response("no user", { status: 200 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("profiles").upsert({
      id: userId,
      is_pro: true,
      plan,
      pro_since: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
});

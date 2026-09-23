// Razorpay webhook (defence-in-depth): grants Pro even if the user closes the app
// before the verify call returns. Configure this URL in the Razorpay dashboard
// with events payment.captured / order.paid and set RAZORPAY_WEBHOOK_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmacHex } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const expected = await hmacHex(Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!, raw);
    if (expected !== signature) return new Response("invalid signature", { status: 400 });

    const event = JSON.parse(raw);
    const kind = event?.event;
    if (kind !== "payment.captured" && kind !== "order.paid") {
      return new Response("ignored", { status: 200 });
    }
    const notes =
      event?.payload?.payment?.entity?.notes || event?.payload?.order?.entity?.notes || {};
    const userId = notes.user_id;
    const plan = notes.plan || "lifetime";
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

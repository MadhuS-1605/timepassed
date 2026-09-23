// Polls Basescan for incoming USDC transfers to our receiving address and
// matches them to pending crypto_payment_requests by exact amount. Run this on
// a schedule (Supabase Cron → every 5 min) hitting this function's URL; it
// takes no request body and needs no user auth.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "../_shared/cors.ts";

Deno.serve(async () => {
  try {
    const address = Deno.env.get("USDC_RECEIVE_ADDRESS")!;
    const apiKey = Deno.env.get("BASESCAN_API_KEY")!;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: pending, error: pendErr } = await admin
      .from("crypto_payment_requests")
      .select("id, user_id, plan, amount_usdc, created_at")
      .eq("status", "pending");
    if (pendErr) return new Response(pendErr.message, { status: 500 });
    if (!pending?.length) return new Response("nothing pending", { status: 200 });

    const url =
      `https://api.basescan.org/api?module=account&action=tokentx` +
      `&contractaddress=${USDC_CONTRACT_ADDRESS}&address=${address}` +
      `&sort=desc&apikey=${apiKey}`;
    const resp = await fetch(url);
    const body = await resp.json();
    const transfers: Array<{ to: string; value: string; hash: string; timeStamp: string }> =
      body?.result || [];

    for (const req of pending) {
      const expectedUnits = BigInt(Math.round(req.amount_usdc * 10 ** USDC_DECIMALS));
      const match = transfers.find(
        (t) =>
          t.to?.toLowerCase() === address.toLowerCase() &&
          BigInt(t.value) === expectedUnits &&
          Number(t.timeStamp) * 1000 >= new Date(req.created_at).getTime(),
      );
      if (!match) continue;

      await admin
        .from("crypto_payment_requests")
        .update({ status: "confirmed", tx_hash: match.hash, confirmed_at: new Date().toISOString() })
        .eq("id", req.id);
      await admin.from("profiles").upsert({
        id: req.user_id,
        is_pro: true,
        plan: req.plan,
        pro_since: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
});

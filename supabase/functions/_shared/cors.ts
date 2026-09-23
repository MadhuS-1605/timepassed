export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// HMAC-SHA256 → lowercase hex (Razorpay signature format).
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Server-authoritative pricing. Amounts are in the smallest currency unit
// (paise for INR). NEVER trust an amount sent from the client.
export const PLANS: Record<string, { amount: number; currency: string; label: string }> = {
  lifetime: { amount: 99900, currency: "INR", label: "TimePassed Pro (Lifetime)" },
  yearly: { amount: 49900, currency: "INR", label: "TimePassed Pro (1 Year)" },
};

// USD pricing for Stripe + crypto (Razorpay stays INR-only). Amounts in cents.
export const USD_PLANS: Record<string, { amount: number; label: string }> = {
  lifetime: { amount: 1200, label: "TimePassed Pro (Lifetime)" },
  yearly: { amount: 600, label: "TimePassed Pro (1 Year)" },
};

// USDC on Base.
export const USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;

// Stripe signs webhooks as `t=<ts>,v1=<hex hmac of "<ts>.<raw body>">`.
export async function verifyStripeSignature(
  secret: string,
  rawBody: string,
  header: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string]),
  );
  if (!parts.t || !parts.v1) return false;
  const expected = await hmacHex(secret, `${parts.t}.${rawBody}`);
  return expected === parts.v1;
}

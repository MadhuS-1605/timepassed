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

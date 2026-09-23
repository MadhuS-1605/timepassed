# Backend Setup — Cloud Sync + Pro (Supabase + Razorpay/Stripe/Crypto)

TimePassed is **local-first**: it works fully on-device with no account. This
optional backend adds **cloud sync** and **Pro unlock**, payable via
**Razorpay** (INR), **Stripe** (USD), or **USDC on Base** (crypto).
Until you complete this, the app simply doesn't show sign-in / sync / purchase.
All three rails are independent — set up only the ones you need.

**Architecture**
- **Supabase** = Auth (email/password) + Postgres (`profiles.is_pro`,
  `crypto_payment_requests`) + Storage (private per-user backup file) +
  Edge Functions (one pair of create/verify per payment rail).
- **Razorpay / Stripe** = hosted checkout. Secret keys never touch the
  client — orders/sessions are created and payments verified inside Edge
  Functions.
- **Crypto** = no processor. A fixed USDC-on-Base address collects payment;
  each purchase reserves a unique amount (base price + a few random
  micro-cents) so a scheduled `crypto-watcher` function can match an
  on-chain transfer to the right user by amount alone, then grant Pro.
- The client checks `profiles.is_pro` for entitlement; new users get a 7-day
  free trial (local) of Pro features.

---

## 1. Create the Supabase project
1. Create a project at https://supabase.com → note the **Project URL** and
   **anon public key** (Project Settings → API).
2. **Auth → Providers → Email**: enable it. For instant password sign-in,
   turn **"Confirm email" OFF** (Auth → Settings) — or leave it on and users
   confirm via email before signing in.

## 2. Run the database migrations
SQL Editor → paste & run, in order:
1. [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) —
   `profiles` + RLS, the auto-profile trigger, and the private `backups`
   storage bucket with per-user policies.
2. [`supabase/migrations/0002_crypto_payments.sql`](../supabase/migrations/0002_crypto_payments.sql) —
   `crypto_payment_requests` (only needed if you're enabling crypto payments).

## 3. Create a Razorpay account
1. Sign up at https://razorpay.com (test mode is fine to start).
2. Dashboard → Settings → API Keys → **Generate** → copy **Key ID** and
   **Key Secret**.

## 4. Deploy the Edge Functions
Install the CLI (`npm i -g supabase`), then:
```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# Secrets (server-only — never in the client bundle):
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret   # optional, for the webhook

# Deploy:
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify
supabase functions deploy razorpay-webhook   # optional
```
> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
> into functions automatically — you don't set those.

## 5. (Optional) Configure the webhook
Razorpay Dashboard → Settings → Webhooks → add
`https://YOUR-PROJECT.supabase.co/functions/v1/razorpay-webhook`, select
**payment.captured** and **order.paid**, set the secret to match
`RAZORPAY_WEBHOOK_SECRET`. This grants Pro even if the app closes mid-payment.

## 6. (Optional) Add Stripe
1. Sign up at https://stripe.com, get your **Secret key** (Developers → API keys).
2. Deploy + set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # from step 3
   supabase secrets set APP_URL=https://timepassed.wtf     # fallback return URL

   supabase functions deploy stripe-create-checkout-session
   supabase functions deploy stripe-webhook
   ```
3. Stripe Dashboard → Developers → Webhooks → add endpoint
   `https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook`, select
   **checkout.session.completed**, copy its signing secret into
   `STRIPE_WEBHOOK_SECRET` above. The webhook — not the checkout redirect —
   is what grants Pro, so this step is required, not optional, for Stripe to
   actually work.
4. Pricing is set in `USD_PLANS` in `_shared/cors.ts` (see **Pricing** below).

## 7. (Optional) Add crypto (USDC on Base)
1. Get a Base address you control to receive payments, and a free
   [Basescan](https://basescan.org/apis) API key.
2. Deploy + set secrets:
   ```bash
   supabase secrets set USDC_RECEIVE_ADDRESS=0xyouraddress
   supabase secrets set BASESCAN_API_KEY=your_basescan_key

   supabase functions deploy crypto-create-request
   supabase functions deploy crypto-watcher
   ```
3. Schedule `crypto-watcher` to run every 5 minutes: Supabase Dashboard →
   Edge Functions → `crypto-watcher` → **Cron** → `*/5 * * * *`. It needs no
   auth header — it authenticates to Postgres with the service-role key
   that's already injected.
4. Unlike Razorpay/Stripe, there's no processor confirming payment
   instantly — Pro grants only after `crypto-watcher`'s next run sees the
   on-chain transfer, typically within a few minutes.

## 8. Wire the client env
Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```
Stripe and crypto need **no client-side keys** — both flows are entirely
server-side (hosted checkout redirect / address display).
Restart `pnpm dev`. The **Data** page now shows Account + Pro + Cloud sync.

## 9. Test the flow
1. Open **Data** → create an account → sign in.
2. **Pay with Razorpay** → Checkout opens. In test mode use card
   `4111 1111 1111 1111`, any future expiry/CVV.
3. After payment, `razorpay-verify` flips `is_pro=true`; the badge shows
   "Unlocked ✓". **Pay with Stripe** and **Pay with crypto** grant Pro the
   same way, via their own verify/webhook/watcher paths.
4. **Back up to cloud** then, on another device/browser, sign in and
   **Restore from cloud**.

---

## Pricing
- Razorpay: `PLANS` in [`supabase/functions/_shared/cors.ts`](../supabase/functions/_shared/cors.ts)
  (amounts in **paise**: `99900` = ₹999).
- Stripe + crypto: `USD_PLANS` in the same file (amounts in **cents**: `1200` = $12).
  Both rails share this pricing so a plan means the same thing everywhere.
The amount is always decided server-side; the client can never override it.

## Where Pro is gated
Today: **cloud sync** (`requirePro()` in `src/pages/Data.jsx`). To gate more
features, read `proEffective` from `useEntitlement(user)` and show the upgrade
prompt where you'd otherwise run the Pro-only action (e.g. premium wallpaper
templates, unlimited memories, custom themes).

## Going live
- Razorpay: complete KYC, switch to **live** keys (`rzp_live_…`), update the
  function secrets + `VITE_RAZORPAY_KEY_ID`.
- Stripe: switch to **live** secret key + re-create the webhook endpoint in
  live mode (test and live webhooks/secrets are separate).
- Crypto: double-check `USDC_RECEIVE_ADDRESS` is a wallet you control the
  keys for — there's no recovery path for a typo'd address.
- Capacitor (Android/iOS): Razorpay Checkout loads in the webview. For a more
  native sheet you can later add the Razorpay Capacitor plugin; the web flow
  here works without it.
- Update the privacy policy / store copy: with accounts + sync enabled, the app
  is no longer strictly "no account, on-device only" for users who opt in.


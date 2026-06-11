# Backend Setup — Cloud Sync + Pro (Supabase + Razorpay)

TimePassed is **local-first**: it works fully on-device with no account. This
optional backend adds **cloud sync** and **Pro unlock** (paid via Razorpay).
Until you complete this, the app simply doesn't show sign-in / sync / purchase.

**Architecture**
- **Supabase** = Auth (email/password) + Postgres (`profiles.is_pro`) + Storage
  (private per-user backup file) + Edge Functions (Razorpay order + verify).
- **Razorpay** = payment gateway. The **key secret never touches the client** —
  orders are created and signatures verified inside Edge Functions.
- The client checks `profiles.is_pro` for entitlement; new users get a 7-day
  free trial (local) of Pro features.

---

## 1. Create the Supabase project
1. Create a project at https://supabase.com → note the **Project URL** and
   **anon public key** (Project Settings → API).
2. **Auth → Providers → Email**: enable it. For instant password sign-in,
   turn **"Confirm email" OFF** (Auth → Settings) — or leave it on and users
   confirm via email before signing in.

## 2. Run the database migration
SQL Editor → paste & run [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
This creates `profiles` + RLS, the auto-profile trigger, and the private
`backups` storage bucket with per-user policies.

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

## 6. Wire the client env
Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```
Restart `pnpm dev`. The **Data** page now shows Account + Pro + Cloud sync.

## 7. Test the flow
1. Open **Data** → create an account → sign in.
2. **Unlock Pro** → Razorpay Checkout opens. In test mode use card
   `4111 1111 1111 1111`, any future expiry/CVV.
3. After payment, `razorpay-verify` flips `is_pro=true`; the badge shows
   "Unlocked ✓".
4. **Back up to cloud** then, on another device/browser, sign in and
   **Restore from cloud**.

---

## Pricing
Set in [`supabase/functions/_shared/cors.ts`](../supabase/functions/_shared/cors.ts)
→ `PLANS` (amounts in **paise**: `99900` = ₹999). The amount is decided
server-side; the client can never override it.

## Where Pro is gated
Today: **cloud sync** (`requirePro()` in `src/pages/Data.jsx`). To gate more
features, read `proEffective` from `useEntitlement(user)` and show the upgrade
prompt where you'd otherwise run the Pro-only action (e.g. premium wallpaper
templates, unlimited memories, custom themes).

## Going live
- Razorpay: complete KYC, switch to **live** keys (`rzp_live_…`), update the
  function secrets + `VITE_RAZORPAY_KEY_ID`.
- Capacitor (Android/iOS): Razorpay Checkout loads in the webview. For a more
  native sheet you can later add the Razorpay Capacitor plugin; the web flow
  here works without it.
- Update the privacy policy / store copy: with accounts + sync enabled, the app
  is no longer strictly "no account, on-device only" for users who opt in.

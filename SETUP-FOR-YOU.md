# 👋 START HERE — EventHene Setup

You said you're non-technical. This is the absolute simplest version of how to get EventHene running. Follow it step by step. Don't skip steps.

---

## 🎯 What you'll have at the end

A working version of EventHene running on your computer that you can click around in. After that, we'll put it on the real internet.

---

## STEP 1 — Sign up for accounts (30 minutes)

Open these 6 websites in new tabs and sign up. Use the same email for all of them so you don't lose track:

1. **GitHub** → https://github.com/signup (stores your code)
2. **Vercel** → https://vercel.com/signup (click "Continue with GitHub")
3. **Supabase** → https://supabase.com → "Start your project"
4. **Clerk** → https://clerk.com → Sign up
5. **Resend** → https://resend.com → Sign up
6. **Paystack** → https://paystack.com → Sign up (you'll need your Ghana business name and bank details for payouts; you can start without filling these and add later)

✅ When done: you have 6 dashboards open. Don't close them — we'll grab API keys from them next.

---

## STEP 2 — Set up Supabase (the database)

1. In Supabase, click **"New Project"**.
2. Name it `eventhene`. Pick a database password and **write it down**. Region: pick the closest to Ghana (e.g. eu-west-2 London or eu-central-1 Frankfurt).
3. Wait ~2 minutes for it to provision.
4. When ready, click **Project Settings** (gear icon) → **Database** → scroll to **"Connection string"** → click **"URI"** tab. Copy the long string. **That's your `DATABASE_URL`.** Save it in a notes file.
5. Same page, copy the **"Connection pooling"** URL too — that's your `DIRECT_URL`.
6. Click **Project Settings** → **API** → copy the **"Project URL"** (that's `NEXT_PUBLIC_SUPABASE_URL`) and the **`service_role` secret** key (that's `SUPABASE_SERVICE_ROLE_KEY`).
7. Click **Storage** in the left sidebar → **New bucket** → name it `flyers` → make it **public**. Repeat for `tickets` (keep this one **private**).

✅ When done: you've got 4 values written down (DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) and 2 buckets created.

---

## STEP 3 — Set up Clerk (the login system)

1. In Clerk, create a new application called `EventHene`.
2. Pick sign-in methods: **Email** + **Google** (recommended).
3. On the API Keys page, copy the **Publishable key** (starts with `pk_test_`) → that's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. Copy the **Secret key** (starts with `sk_test_`) → that's `CLERK_SECRET_KEY`.

✅ When done: 2 more keys saved.

---

## STEP 4 — Set up Resend (email)

1. In Resend, go to **API Keys** → **Create API Key** → name it `EventHene`.
2. Copy the key (starts with `re_`) → that's `RESEND_API_KEY`.
3. For testing, you can use Resend's default sandbox sender. For going live, you'll add your own domain.

✅ When done: 1 more key.

---

## STEP 5 — Set up Paystack (payments) — OPTIONAL FOR NOW

You can skip this and come back when you're ready to test real payments.

1. In Paystack dashboard, go to **Settings** → **API Keys & Webhooks**.
2. Copy the **Test Secret Key** (starts with `sk_test_`) → that's `PAYSTACK_SECRET_KEY`.
3. Copy the **Test Public Key** → that's `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`.

---

## STEP 6 — Tell EventHene about your keys

1. Open the EventHene folder (`C:\Users\worsh\CODE CLAUDE\eventhene`) in **VS Code** (download free: https://code.visualstudio.com).
2. You'll see a file called **`.env.example`**. Right-click it → **Copy** → paste in the same folder → rename the copy to **`.env.local`** (note the leading dot).
3. Open `.env.local`. For each line, paste in the value you saved earlier. Lines you can leave blank for now: SMS, Stripe, Upstash, Sentry.
4. For `QR_SIGNING_SECRET`, type any random string of 50+ characters (e.g. mash your keyboard: `kj3h4kj2hg34kjhg23k4j5hg345kjh2g34kjh5g3k4jh5g34kj2hg`).
5. Save the file.

✅ When done: `.env.local` exists and has your real keys.

---

## STEP 7 — Install + run

Open a terminal in the eventhene folder. (In VS Code: Terminal menu → New Terminal.)

Run these commands one at a time:

```bash
npm install
```

Wait until it finishes. (2–5 min.)

```bash
npm run db:push
```

This creates all the database tables.

```bash
npm run db:seed
```

This adds sample data.

```bash
npm run dev
```

✅ When done: open http://localhost:3000 in your browser. You should see EventHene with a sample event.

---

## STEP 8 — Make yourself an admin

1. Go to http://localhost:3000/signup, create an account.
2. Open Supabase → SQL Editor → New Query → paste:
   ```sql
   UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'YOUR@EMAIL.HERE';
   ```
   Replace with your real email. Click **Run**.
3. Now visit http://localhost:3000/admin — you're in.

---

## STEP 9 — Try the full flow

1. Sign out. Sign up again with a **different email**.
2. Click "Create event — free" → set up your own test event.
3. Open the public link (visible from your event dashboard).
4. Pretend you're a buyer — go through checkout (free event = instant ticket, paid event = needs Paystack test card `4084 0840 8408 4081`).
5. Open the scanner from `/scan` and scan the QR from the success page.

---

## When something doesn't work

| Problem | Fix |
|---|---|
| `npm install` errors | Make sure you have Node.js installed: https://nodejs.org (LTS version) |
| Can't connect to database | Re-check `DATABASE_URL` is the full URI including `:password@` |
| "Forbidden" on /admin | Run the SUPER_ADMIN SQL again, then sign out + back in |
| QR scanner won't open camera | Browser blocks camera on `http://localhost`. Try `https://` once deployed, or use Chrome with `chrome://flags/#unsafely-treat-insecure-origin-as-secure` set to `http://localhost:3000` |
| Emails don't arrive | If `RESEND_API_KEY` is empty, emails are skipped silently. Check the terminal logs. |

---

## Ready to go live?

When you've tested everything locally:

1. Create a private GitHub repo called `eventhene`.
2. In the terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial EventHene MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/eventhene.git
   git push -u origin main
   ```
3. Go to Vercel → "Import Project" → pick `eventhene`.
4. In Vercel → Project Settings → Environment Variables → paste **every variable from your `.env.local`** (except change `NEXT_PUBLIC_APP_URL` to `https://your-real-domain.com`).
5. Click **Deploy**. Wait ~3 minutes.
6. Your site is live on a `*.vercel.app` URL. Buy `eventhene.com` separately and point it at Vercel.

---

You got this. Long live the king. ♛

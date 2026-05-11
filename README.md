# EventHene ♛

Premium event ticketing, registration, attendance & promotion. Built for Ghana. Ready for the world.

---

## What's in this folder

A complete, runnable Next.js application:

- 🏠 Marketing site (home, pricing, services, browse events, about, terms, privacy, refund)
- 🎟️ Public event pages with shareable links + checkout
- 💳 Paystack integration (Ghana/Nigeria) with webhook + idempotency
- 📋 Organizer dashboard with event creation wizard
- 📸 PWA QR scanner with anti-fraud validation
- 🛡️ Admin dashboard with free-event approval queue
- 📧 Email delivery (Resend) + branded PDF tickets (react-pdf)
- 📊 Excel/CSV attendee export
- 🔐 Clerk authentication + role-based access

---

## Quickstart (for non-technical owners)

> **You're not running terminal commands every day. Bookmark this guide.**

### 1. Create accounts (~30 min)

Sign up for the free tier on each — no payment info needed for the first 5:

| Service | Why | URL |
|---|---|---|
| **GitHub** | Stores your code | https://github.com/signup |
| **Vercel** | Hosts the website (sign in with GitHub) | https://vercel.com/signup |
| **Supabase** | Database + file storage | https://supabase.com |
| **Clerk** | Login system for users | https://clerk.com |
| **Resend** | Sends ticket emails | https://resend.com |
| **Paystack** | Collects payments (needs Ghana business info + bank account) | https://paystack.com |

Optional (for later):
- **Upstash** — rate limiting + background jobs (https://upstash.com)
- **Sentry** — error monitoring (https://sentry.io)
- **Twilio** — SMS reminders (https://twilio.com)

### 2. Install the code

Open a terminal in this folder and run:

```bash
npm install
```

This downloads all the building blocks the app needs. Takes 2–5 minutes the first time.

### 3. Set up your environment file

Copy the template:

```bash
cp .env.example .env.local
```

(On Windows in Git Bash, that command works. In PowerShell use `Copy-Item .env.example .env.local`.)

Open `.env.local` in a text editor (VS Code, Notepad++) and fill in the values from each service's dashboard. The file has a comment above every variable telling you where to find it.

**At minimum to start:**
- `DATABASE_URL` and `DIRECT_URL` from Supabase
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from Clerk
- `RESEND_API_KEY` from Resend (or skip — emails will just log to console)
- `QR_SIGNING_SECRET` — generate one by running: `openssl rand -base64 48` (or pick any 50+ random characters)
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase

You can leave Paystack blank until you're ready to test payments.

### 4. Create the database tables

```bash
npm run db:push
```

This builds all the tables (events, tickets, users, etc.) inside your Supabase database. Takes ~30 seconds.

### 5. Seed example data

```bash
npm run db:seed
```

This adds a sample organizer + DJ Kay Birthday Bash event + a free event awaiting approval, so the homepage and admin dashboard aren't empty when you start.

### 6. Run the app

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see EventHene's homepage with the sample event.

### 7. Try it

- Click "Browse events" → click the sample event → click "Continue to checkout"
- Click "Create event — free" → sign up with email → fill in your first event
- Visit `/admin` after promoting yourself to admin (see below)

---

## Promoting yourself to admin

After you sign up with Clerk:

1. Open Supabase Dashboard → SQL Editor
2. Run:
   ```sql
   UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
   ```

Now `/admin` works for you.

---

## Going live (when you're ready)

1. Push this code to GitHub (a new private repo).
2. Go to Vercel → "Import Project" → pick the GitHub repo.
3. In Vercel project settings → Environment Variables → paste everything from your `.env.local`. Make sure to change `NEXT_PUBLIC_APP_URL` to your real domain (e.g. `https://eventhene.com`).
4. Add `https://eventhene.com/api/webhooks/paystack` to your Paystack dashboard → API Keys & Webhooks.
5. Add `https://eventhene.com/api/webhooks/clerk` to Clerk dashboard → Webhooks.
6. Click "Deploy" in Vercel.
7. Buy `eventhene.com` from Namecheap or Porkbun (~$10/year). Point it at Vercel.

---

## How the QR security works

Every ticket gets:

- **Visible reference** (e.g. `WOR-DJKAY-4134123`) — for humans to read and search.
- **QR token** — a 32-byte random string, signed with HMAC-SHA256 using your `QR_SIGNING_SECRET`.

When someone scans:

1. The scanner sends the QR to the server.
2. Server checks the signature is valid (otherwise the QR is fake).
3. Server looks up the ticket by hashed token.
4. Server checks: right event? paid? not used? not refunded?
5. Server atomically marks the ticket as ATTENDED (so a duplicate scan instantly says "already used").
6. Every scan is logged with the scanner's user ID, timestamp, IP, and user-agent.

A screenshot of the QR works **once**. After that — instant "already scanned" warning.

---

## Project structure

```
eventhene/
├── app/
│   ├── (marketing)/       Public pages
│   ├── dashboard/         Organizer dashboard
│   ├── admin/             Admin dashboard
│   ├── scan/              PWA scanner
│   ├── api/               Backend API routes
│   ├── login/, signup/    Clerk sign-in pages
│   ├── onboarding/        Post-signup wizard
│   ├── layout.tsx         Root layout
│   └── globals.css        Tailwind + design tokens
├── components/            Reusable React components
├── lib/                   Pure business logic
│   ├── db.ts              Prisma client
│   ├── auth.ts            Role guards
│   ├── qr.ts              QR generation + verification
│   ├── refs.ts            Visible ticket references
│   ├── fees.ts            5% platform fee + processor math
│   ├── email.ts           Resend templates
│   ├── storage.ts         Supabase file uploads
│   ├── payments/          Paystack + Stripe abstractions
│   └── services/          Orders, tickets, exports, notifications, PDF render
├── prisma/
│   ├── schema.prisma      Database schema
│   └── seed.ts            Sample data
├── middleware.ts          Auth middleware
├── tailwind.config.ts     Design system tokens
├── package.json
└── README.md (this file)
```

---

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally on port 3000 |
| `npm run build` | Build for production (Vercel runs this automatically) |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:seed` | Add sample data |
| `npm run db:studio` | Open a visual database browser (very useful!) |
| `npm run db:migrate` | Create + apply a proper migration |

---

## Roadmap (post-MVP)

- [ ] Direct flyer upload (currently URL-only)
- [ ] Stripe integration for diaspora payments
- [ ] SMS reminders (Twilio)
- [ ] Promotion purchase flow + featured ranking
- [ ] Offline scanner mode
- [ ] Refund tooling for admin
- [ ] Mobile apps (Capacitor wrapping the PWA)
- [ ] Multi-language (Twi + French)

---

## Need help?

Email support@eventhene.com (when live) or open an issue on GitHub.

Long live the king. ♛

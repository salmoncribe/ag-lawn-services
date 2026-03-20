# Lubbock Lawn Pros

Production-ready Next.js 15 starter site for a new lawn care business in Lubbock, Texas. The app includes a polished marketing site, multi-step booking flow, protected dashboard, Prisma schema, Neon Postgres setup, and Stripe Checkout session creation on every booking.

## Stack

- Next.js 15 App Router
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Prisma + Neon Postgres
- NextAuth.js Credentials provider only
- Stripe Checkout Sessions
- React Hook Form + Zod
- Framer Motion
- Lucide icons
- Date-fns + shadcn Calendar

## Environment variables

Replace these values:

```bash
NEON_DATABASE_URL=your-neon-connection-string-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_SECRET=generate-a-random-32-char-string-here
NEXTAUTH_URL=http://localhost:3000
```

## Local setup

```bash
npm install
cp .env.example .env.local
```

Update `.env.local` with your real Neon and Stripe values, then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prisma commands

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

## Booking and auth behavior

- Booking uses a server action to create a brand-new Stripe Checkout Session every time.
- Stripe success returns to `/dashboard?success=true`.
- The dashboard is protected with NextAuth credentials sessions.
- The `authorize` flow checks the seeded account records stored in Prisma.

## Stripe notes

- `STRIPE_SECRET_KEY` is used server-side to create Checkout Sessions.
- `STRIPE_PUBLISHABLE_KEY` is passed into the booking UI for `redirectToCheckout`.
- Success URL: `/dashboard?success=true&bookingId=...&session_id=...`
- Cancel URL: `/pricing`

## Neon notes

- Use your Neon Postgres connection string for `NEON_DATABASE_URL`.
- `prisma db push` will create the schema directly in Neon.
- The seed script inserts Billy, Josh, sample bookings, and one subscription per user.

## Deployment notes for Vercel + Neon

- Create a new Vercel project from this repo.
- Add the same environment variables in Vercel:
  - `NEON_DATABASE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
- Point `NEXTAUTH_URL` at your production domain.
- Run `npm run db:push` and `npm run db:seed` against Neon before or immediately after launch.
- Vercel auto-detects the app as Next.js through `vercel.json`.

## Project highlights

- `/` landing page with hero, trust bar, services, why-us, testimonials, and embedded booking flow
- `/services` clear mowing and treatment pricing
- `/pricing` bundles, subscriptions, savings toggle, and upsell framing
- `/book` full-screen multi-step booking wizard
- `/login` protected access page
- `/dashboard` protected account dashboard with confetti success state

## Useful files

- `app/page.tsx`
- `app/book/page.tsx`
- `app/dashboard/page.tsx`
- `lib/actions.ts`
- `auth.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`

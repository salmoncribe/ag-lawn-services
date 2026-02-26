# ClipperAI

ClipperAI is a FastAPI + Supabase SaaS app for streamers that auto-detects highlights, processes short-form vertical clips, and delivers them through a web dashboard.

## Stack

- Backend: Python, FastAPI, APScheduler
- Database/Auth/Storage: Supabase (Postgres + Auth + Storage)
- Payments: Stripe Checkout + Billing Portal + Webhooks
- Frontend: Plain HTML/CSS/JS (no framework)
- Processing: `yt-dlp`, Whisper (`base`), FFmpeg

## Implemented Features

- Supabase email/password auth flow support
- Protected dashboard via Supabase JWT
- Profile + settings persistence in Supabase
- Stripe subscription tiers: Basic / Pro / Agency
- Stripe webhook-based plan updates on success/failure/cancel
- Twitch OAuth connect callback and token storage (encrypted)
- Kick API key connect flow and encrypted storage
- Background monitoring scheduler:
  - Polls connected profiles
  - Detects Twitch live status and chat spikes/keywords
  - Polls Kick live status with viewer-spike fallback trigger
- Clip pipeline:
  - Segment download (`yt-dlp`)
  - Whisper caption SRT generation
  - 9:16 vertical render + subtitle burn-in + watermark via FFmpeg
- Supabase Storage upload + clip gallery metadata
- Clip list and deletion API
- 30-day retention cleanup job
- Landing, pricing, auth, and dashboard pages

## Project Layout

- `backend/app/main.py` - FastAPI app, router wiring, scheduler startup
- `backend/app/routers/` - API routes (`auth`, `user`, `billing`, `clips`)
- `backend/app/services/` - Supabase, Stripe, Twitch, monitoring, video pipeline
- `backend/static/` - frontend HTML/CSS/JS
- `backend/sql/schema.sql` - Supabase schema + RLS + cleanup function

## Setup

1. Install system tools:
   - `ffmpeg`
   - `yt-dlp`
   - Python 3.11+

2. Create Supabase project and run:
   - `backend/sql/schema.sql`

3. Configure Supabase Auth:
   - Site URL: `http://localhost:8000`
   - Redirect URL: `http://localhost:8000/auth/twitch/callback`

4. Configure Twitch app:
   - OAuth Redirect URL: `http://localhost:8000/auth/twitch/callback`

5. Configure Stripe:
   - Create recurring prices for Basic/Pro/Agency
   - Set webhook endpoint to `http://localhost:8000/billing/webhook`
   - Enable events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

6. Configure environment:

```bash
cd backend
cp .env.example .env
```

Update `.env` with real Supabase/Stripe/Twitch keys.

7. Set frontend runtime config:
   - Edit `backend/static/js/config.js`
   - Set `supabaseUrl` and `supabaseAnonKey`

8. Install Python packages and run:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000`.

## Docker

```bash
cp backend/.env.example backend/.env
# fill values in backend/.env

docker compose up --build
```

## API Routes

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/twitch/start`
- `GET /auth/twitch/callback`
- `GET /user/profile`
- `PUT /user/settings`
- `PUT /user/connect/kick`
- `DELETE /user/connect/kick`
- `DELETE /user/connect/twitch`
- `GET /clips`
- `DELETE /clips/{clip_id}`
- `POST /billing/checkout`
- `POST /billing/portal`
- `POST /billing/webhook`

## Notes

- Twitch and Kick APIs evolve frequently; verify scopes, endpoints, and API limits in your account.
- Whisper model download happens on first run and can take time.
- For production, put FastAPI behind HTTPS reverse proxy and lock CORS origins.

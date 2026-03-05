# TicketFlow – Internal IT Support Management System (Frontend)

Internal Helpdesk SPA built with React + TypeScript and Vite.

## Requirements coverage

- React + TypeScript SPA
- Connects to backend REST API
- Implements task CRUD from UI (create, read, update, delete)

## Setup

1. Create `.env` from `.env.example`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

## Environment variable

- `VITE_API_URL` (example: `http://localhost:5005/api`)

## Deploy notes

- Deploy to Netlify/Vercel.
- Set `VITE_API_URL` to deployed backend URL.

## Vercel first-login latency notes

If the first login on production takes several seconds but local is fast, this is usually expected serverless cold-start behavior.

Frontend mitigations already implemented:

- API pre-warm call on auth screen load (`/health`).
- Skip redundant profile bootstrap request right after successful login/register.
- Auth button loading state while request is in flight.

Quick verification with Chrome DevTools:

1. Open Network tab with No throttling and Preserve log.
2. Keep Disable cache off for normal testing.
3. Login and compare first run vs second run for:
   - `/auth/login`
   - `/users`
   - `/tickets?scope=active`
4. If first run is slow and second is much faster, latency is likely cold-start related.

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

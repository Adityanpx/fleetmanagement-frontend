# BulkerTrack — Fleet Management Frontend

Web app for managing a bulker truck fleet: trips, expenses, freight payments and reports.
Built with Next.js (App Router, TypeScript), Tailwind CSS, SWR and Recharts. Mobile-first, with a sidebar layout on desktop.

It talks only to the BulkerTrack backend API.

## Setup

```bash
npm install
cp .env.example .env      # then set NEXT_PUBLIC_API_URL to the backend URL
npm run dev               # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend (default `http://localhost:4000`) |

The backend's `CORS_ORIGIN` must include this app's URL.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint

## Features

- **Dashboard** — income, cost, profit, pending, monthly profit chart, expenses by category, profit by vehicle, running trips, document expiry alerts
- **Trips** — create, edit, change status (complete needs end odometer, cancel needs a reason), delete
- **Trip detail** — category-based expenses (diesel auto-calculates litres × rate), payments received, live profit/pending
- **Company diesel** — per-trip switch to deduct company-given diesel from freight, defaulting from the company
- **Vehicles / Companies** — CRUD; records with trips are deactivated instead of deleted
- **Expenses** — ledger across all trips with category totals
- **Reports** — trips, vehicles, fuel (km/L, ₹/km), companies; filter by period, vehicle, company

## Structure

```
app/(app)/      authenticated pages (guarded by app/(app)/layout.tsx)
app/login/      login page
components/     AppShell, FilterBar, TripForm, ExpenseForm, ui/ primitives
lib/            API client, auth, formatting, period filters, types
```

Auth: the JWT from `/api/auth/login` is kept in `localStorage` and sent as a Bearer token; a 401 sends the user back to `/login`.

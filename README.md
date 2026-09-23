# OPULUXE BEAUTY STUDIO — Booking System

**Your Beauty, Elevated.** A full booking platform for a luxury hair studio:
public site with price list and online booking, plus an admin dashboard to
manage everything.

## Stack

| Layer   | Tech                                                       |
| ------- | ---------------------------------------------------------- |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt      |
| Client  | React 18, Vite, React Router 6, Tailwind CSS 3, Axios       |

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Backend

```bash
cd server
npm install
cp .env.example .env      # set MONGO_URI (local or Atlas) + JWT_SECRET
npm run seed              # creates the admin account + 23-service menu
npm run dev               # 🚀 API on http://localhost:5000
```

For MongoDB Atlas, use a connection string like:
`mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/opuluxe?retryWrites=true&w=majority`

### 3. Client

```bash
cd client
npm install
npm run dev               # ✨ Site on http://localhost:5173
```

> The Vite dev server proxies `/api` to `http://localhost:5000`, and the
> client's `VITE_API_URL` default also points there — no extra config needed
> for local development.

### Admin access

The dashboard lives at **`/admin/login`** (not linked from the public site).

Login credentials are set when you seed the database, via environment
variables in `server/.env` — they are intentionally **not** documented here:

```
ADMIN_EMAIL=...        # set before running npm run seed
ADMIN_PASSWORD=...     # min 6 characters
```

Change the password from **Admin → Settings** after first login.

## Features

### Public site
- **Landing page** — hero, featured services, full categorized price list.
- **Online booking** — pick a service, choose a date, and pick from live
  time slots (07:00–20:00, half-hour steps) that already respect each
  appointment's duration — overlapping slots are greyed out. Confirmation
  shows a unique reference like `OBS-5RXARB`.
- **Booking tracker** — customers look up any booking by reference and see
  live status (Requested → Confirmed → Completed) and payment state.

### Admin dashboard (`/admin`)
- **Dashboard** — stats (today's bookings, pending, confirmed, completed,
  revenue) and a filterable/searchable list of every booking. Change status
  and payment status inline, quick-action buttons for the common flow
  (pending → confirmed → completed), delete bookings.
- **Services** — full CRUD for the price list: name, price / price range
  (e.g. K40 – K60), duration, category, description, sort order, show/hide.
- **Settings** — change the admin password.

## API Overview

| Method | Route                        | Auth   | Purpose                        |
| ------ | ---------------------------- | ------ | ------------------------------ |
| POST   | `/api/auth/login`            | —      | Login, returns JWT             |
| GET    | `/api/auth/me`               | 🔒     | Current admin                  |
| PUT    | `/api/auth/password`         | 🔒     | Change password                |
| GET    | `/api/services`              | —      | Active services (public menu)  |
| GET    | `/api/services?all=true`     | 🔒     | All services incl. hidden      |
| POST   | `/api/services`              | 🔒     | Create service                 |
| PUT    | `/api/services/:id`          | 🔒     | Update service                 |
| DELETE | `/api/services/:id`          | 🔒     | Delete service                 |
| GET    | `/api/bookings/slots`        | —      | Free slots for `date`+`duration` |
| POST   | `/api/bookings`              | —      | Create booking                 |
| GET    | `/api/bookings/track/:ref`   | —      | Track by reference             |
| GET    | `/api/bookings`              | 🔒     | List w/ filters `search,status,date` |
| GET    | `/api/bookings/stats`        | 🔒     | Dashboard summary              |
| PATCH  | `/api/bookings/:id/status`   | 🔒     | Update booking status          |
| PATCH  | `/api/bookings/:id/payment`  | 🔒     | Update payment status          |
| PUT    | `/api/bookings/:id`          | 🔒     | Generic update                 |
| DELETE | `/api/bookings/:id`          | 🔒     | Delete booking                 |

## Notes

- Booking references use the `OBS-` prefix and an unambiguous alphabet (no
  `0/O/1/I`), collision-checked before insert.
- Double-booking is prevented server-side: bookings store their duration, so
  any overlapping appointment on the same date returns `409`. Slots are also
  clamped to opening hours (07:00–20:00).
- Prices support ranges via `price` + `priceMax` (rendered `K40 – K60`).
- Currency symbol is set once in `client/src/utils.js` (`CURRENCY = "K"`).

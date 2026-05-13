# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymApp is a full-stack gym membership management application. The backend is a Node.js/Express REST API with Prisma ORM (SQLite), and the frontend is React 18 + Vite + Material-UI.

## Development Commands

### Backend (`backend/`)
```bash
npm run dev          # Start with nodemon (auto-reload)
npm run start        # Start production server (port 4000)
npm run db:push      # Sync schema to database without migration
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio UI
```

### Frontend (`frontend/`)
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Setup
Copy `backend/.env.example` to `backend/.env` and fill in values before running the backend.

## Architecture

### Backend (`backend/src/`)
- **`server.js`** — Express entry point, registers all routes, starts cron jobs
- **`config/database.js`** — Prisma client singleton
- **`middleware/auth.js`** — JWT verification middleware applied to all protected routes
- **`controllers/`** — One controller per resource (auth, socios, planes, pagos, dashboard)
- **`routes/`** — Express routers that map HTTP methods to controller functions
- **`services/notificacionService.js`** — Nodemailer email delivery for expiry alerts
- **`jobs/vencimientosJob.js`** — `node-cron` job running daily at 8 AM to mark expired memberships and trigger notifications
- **`uploads/`** — Multer stores member profile photos here; served as static files

### Frontend (`frontend/src/`)
- **`main.jsx`** — React root; sets up MUI theme (primary: `#1e3a5f`, secondary: `#2563eb`)
- **`App.jsx`** — React Router v6 routes + `ProtectedRoute` wrapper that redirects unauthenticated users to `/login`
- **`context/AuthContext.jsx`** — Auth state (user, token) stored in `localStorage`; provides `login`/`logout`
- **`services/api.js`** — Axios instance that auto-injects `Authorization: Bearer {token}` via request interceptor; base URL is `/api` (proxied by Vite to port 4000)
- **`components/Layout/Layout.jsx`** — App shell with MUI `Drawer` navigation
- **`pages/`** — Feature pages grouped by domain: `Socios/`, `Pagos/`, `Vencimientos/`, `Planes/`

### Data Models (Prisma)
- **Usuario** — Admin accounts with hashed passwords and roles
- **Socio** — Gym members (contact info, profile photo, status)
- **Plan** — Membership types (name, duration in days, price)
- **Pago** — Payment records linking a Socio to a Plan, tracks start/end dates and status
- **Notificacion** — Audit log of emails sent for expiring memberships

### API & Auth Flow
1. `POST /api/auth/login` returns a JWT; frontend stores it in localStorage via `AuthContext`
2. All subsequent requests go through `api.js` Axios interceptor which attaches the token
3. Backend `middleware/auth.js` verifies the JWT on every protected route
4. Vite dev proxy forwards `/api` and `/uploads` to `http://localhost:4000`

### Key Behaviors
- Membership expiry is computed from `Pago.fechaFin`; the cron job updates `Socio.estado` to `INACTIVO` when memberships expire
- Member photos are uploaded via multipart form to `POST /api/socios/:id/foto` and stored in `backend/src/uploads/`
- Dashboard stats endpoint aggregates total/active members, monthly revenue, and members expiring within 7 days

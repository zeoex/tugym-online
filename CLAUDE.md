# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymApp (TuGymOnLine) is a full-stack gym membership management application. The backend is a Node.js/Express REST API with Prisma ORM (PostgreSQL), and the frontend is React 18 + Vite + Material-UI.

Deployed to Railway as a single service: the root `package.json` builds the frontend and generates the Prisma client, then `server.js` serves `frontend/dist` when `NODE_ENV=production`. Because the API and the frontend share an origin, `VITE_API_URL` stays empty and requests go to `/api`.

- Production: https://tugym-online-production.up.railway.app (project `tugym-online`, environment `production`)
- Deploy with `railway up`; Railway injects `PORT` and `DATABASE_URL` (the latter via `${{Postgres.DATABASE_URL}}`), so never hardcode either
- Member photos live on a volume mounted at `/app/uploads` (`UPLOADS_DIR`). Without it, every deploy wipes them
- The Postgres is only reachable from inside Railway. To run one-off scripts (seed, migrations) from a laptop, use the `DATABASE_PUBLIC_URL` of the Postgres service
- Schema changes need a real migration (`db:migrate`). Using `db push` against production leaves the repo without the migration, and a fresh database then comes up with an incomplete schema

## Development Commands

### Root — used by Railway
```bash
npm run build        # Install both workspaces, prisma generate, build frontend
npm run start        # prisma migrate deploy, then start the server
```

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
- **`config/uploads.js`** — Resolves the photo directory; `UPLOADS_DIR` points at the Railway volume in production, since the container filesystem is ephemeral
- **`uploads/`** — Multer stores member profile photos here in local dev; served as static files

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
- **RutinaDia** — Daily workout routine per type, unique on (fecha, tipo)
- **CajaDia** — Daily cash register: opening/closing amounts and state
- **Anuncio** — Announcements shown in the member portal
- **Notificacion** — Audit log of emails sent for expiring memberships
- **Configuracion** — Singleton (lazy-created on first GET): gym name, phone, address, latitude/longitude and check-in radius. Editable from the admin Configuración page; never hardcode gym data
- **Asistencia** — Member check-ins (GEO from the portal or MANUAL from reception), with distance and whether the membership was expired at the time; cascade-deleted with its Socio

### API & Auth Flow
1. `POST /api/auth/login` returns a JWT; frontend stores it in localStorage via `AuthContext`
2. All subsequent requests go through `api.js` Axios interceptor which attaches the token
3. Backend `middleware/auth.js` verifies the JWT on every protected route
4. Vite dev proxy forwards `/api` and `/uploads` to `http://localhost:4000`

### Member portal auth
- Members log in with **DNI + password**: first visit triggers activation (`POST /api/portal/activar` creates their password; only works while `Socio.pinHash` is null). `POST /api/portal/login` returns a 30-day JWT with `rol: 'SOCIO'`
- `/api/portal/cuenta`, `/mi-rutina` and `/checkin` require the member token (`authSocio` middleware) — never accept a raw DNI for personal data
- Reception resets access via `PUT /api/socios/:id/portal-reset` (clears pinHash → member re-activates); the socio card shows `portalActivado`
- `pinHash` must NEVER appear in API responses (`sinPin` in sociosController) nor be accepted in update bodies
- Announcements carousel (`AnunciosDestacados`) renders with or without session — gym news always visible

### Member portal & GPS check-in
- The portal (`/portal`) is a public PWA (installable; manifest + `sw.js` in `frontend/public/`) with bottom-nav tabs: Inicio (GPS check-in), Rutina, Carnet (QR credential)
- Members identify by DNI, remembered in `localStorage` (`portal_dni`); lookup ignores dots/dashes via raw SQL `regexp_replace`
- `POST /api/portal/checkin` validates the haversine distance **server-side** against `Configuracion` coords (client GPS accuracy is credited up to 80 m; accuracy > 500 m is rejected). Duplicate check-ins within 3 h are idempotent (`yaRegistrado`)
- Expired membership does NOT block check-in — it flags `cuotaVencida` and the portal shows a renewal warning
- Admin endpoints under `/api/asistencias`: `hoy`, `stats` (peak hours), `inactivos` (active members with no visit in 14+ days, for retention), `manual`
- Streak (`racha`) = consecutive days with ≥1 check-in ending today or yesterday; server timezone matters, so production sets `TZ=America/Argentina/Buenos_Aires`

### Late-payment surcharges (recargos)
- All configurable in `Configuracion`: payment window (`diaPagoDesde`–`diaPagoHasta`, e.g. 1–10), `recargoActivo`, `recargoTipo` (PORCENTAJE|FIJO), `recargoValor`
- The rule lives server-side in `backend/src/utils/recargo.js`: surcharge applies only when paying after `diaPagoHasta`; DIARIO plans never get one; before the window counts as early payment
- `POST /api/pagos` computes the surcharge itself — the UI can only waive it (`aplicarRecargo: false`); a manual `monto` override skips the automatic surcharge. `GET /api/pagos/recargo-info?planId=` returns today's suggested breakdown
- `Pago.recargo` stores the surcharge portion for reporting; `monto` is always the total charged

### Exercise library & routines (DB-driven)
- `Ejercicio` (editable nombre + stable `mediaKey`), `Rutina` (gym templates when `socioId` null, personal routines otherwise), `RutinaItem` (ejercicioId + series/reps/descanso/orden), `Socio.rutinaId` = assigned routine
- **Identity is the ID, never the display name**: renaming an exercise keeps its GIF/steps bound via `mediaKey`. This was a deliberate modeling fix — do not reintroduce name-keyed lookups
- `bibliotecaService.sembrarBiblioteca()` runs at boot, idempotent: seeds ~104 exercises + 20 templates from the hardcoded catalog in `ejerciciosService.js` (which is now SEED DATA ONLY — runtime reads DB, with catalog fallback if empty)
- Media resolution is server-side (`resolverMedia`) and **every exercise has an animation URL**: 79 bundled GIFs in `frontend/public/anim/`, everything else served by the public lazy route `/media/anim/:key.gif` (outside `/api` so it doesn't consume rate limit) which downloads from the dataset's GitHub raw into the volume on first view. `animacionesDataset.json` (backend) indexes all 1,324 with Spanish steps
- The FULL dataset is imported at boot (`importarCatalogoCompleto`, idempotent by mediaKey, skips when count ≥ 1000): ~1,350 exercises with Spanish names generated by a gym-glossary translator (scratchpad one-shot; output committed as `ejerciciosImportados.json`) and `categoria` CUERPO|CALENTAMIENTO (cardio + stretch/mobility keywords). Curated names from the original catalog always win over imported ones
- Daily routine generation still draws ONLY from the gym's `Rutina` templates — the giant catalog never leaks into rutina-del-día
- Admin: Ejercicios page (rename + animation picker over the full catalog), Rutinas → Plantillas tab (builder), DetalleSocio assigns a template or builds a personal routine
- Portal: `GET /api/portal/mi-rutina/:dni` → "Tu rutina" section shows first in the Rutina tab

### Exercise animations
- `frontend/public/anim/*.gif` (79 files, ~7 MB) + `frontend/src/data/ejercicioAnimaciones.json` map Spanish exercise names to animated GIFs and Spanish step-by-step instructions, imported from github.com/hasaneyldrm/exercises-dataset (1,324 exercises)
- The import pipeline lives outside the repo (one-shot scripts); matching was auto + hand-curated. 31 exercises without a decent equivalent intentionally keep their static image — never show a wrong GIF
- `EjercicioDemoModal` prefers GIF + numbered steps, falls back to the static image + handwritten description

### Check-in guards
- If the member already checked in today, the portal home shows a "Ya entrenaste hoy" state instead of the button (`checkinHoy` from `/api/portal/cuenta/:dni`)
- Each phone sends a `deviceId` (UUID in localStorage); the server rejects a check-in for a DIFFERENT socio from the same device within the configured window (`checkinVentanaHs`). Clearing browser data resets the id — proportional barrier, not cryptography

### Theming
- `frontend/src/theme.js` holds both MUI themes and brand tokens (LIMA/INK/NOCHE): `portalTheme` (dark, lime-on-black) and `adminTheme` (light, ink + lime). `App.jsx` mounts one shell per route tree — only one CssBaseline is active at a time
- Fonts are bundled locally via `@fontsource-variable` (Space Grotesk for headings, Inter for body) — no CDN

### Key Behaviors
- Membership expiry is computed from `Pago.fechaFin`; the cron job updates `Socio.estado` to `INACTIVO` when memberships expire
- Member photos are uploaded via multipart form to `POST /api/socios/:id/foto` and stored in the directory resolved by `config/uploads.js`
- Dashboard stats endpoint aggregates total/active members, monthly revenue, and members expiring within 7 days

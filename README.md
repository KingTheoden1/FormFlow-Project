# FormFlow

An accessible, embeddable form builder with optional Stripe payments. Build multi-step forms visually, embed them anywhere with a `<script>` tag, and watch submissions arrive in real time.

---

## Architecture

```
FormFlow/
├── apps/
│   ├── web/        React 18 + Vite + TypeScript frontend (builder + dashboard)
│   └── embed/      Self-contained IIFE bundle (embeddable <script> tag)
├── server/         Node.js + Express + Socket.io backend
└── .github/
    └── workflows/  CI (tests on PR) + CD (deploy to Azure on merge to main)
```

### Data flow

```
[Builder UI] ──CRUD──▶ [Express API] ──SQL──▶ [Azure SQL]
                              │
                        [Socket.io]
                              │
[Dashboard UI] ◀──WS──────────┘

[External page] ──<script>──▶ [Embed bundle] ──POST──▶ [/submissions] ──emit──▶ [Dashboard]
                                                               │
                                                         [Stripe webhook]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, Tailwind CSS |
| Component docs | Storybook 8 (with axe a11y addon) |
| Embed | Vite lib mode (IIFE), Shadow DOM isolation |
| Payments | Stripe Elements + webhook verification |
| Real-time | Socket.io (WebSocket + polling fallback) |
| Backend | Node.js, Express, TypeScript |
| Database | Azure SQL (mssql driver, parameterized queries) |
| Hosting | Azure Static Web Apps (frontend), Azure App Service (backend) |
| Testing | Jest + React Testing Library (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- An Azure account (for deployment)
- A Stripe account (for payment features)

### Local setup

```bash
# 1. Clone
git clone https://github.com/KingTheoden1/FormFlow.git
cd FormFlow

# 2. Install all workspace dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# 4. Start dev servers (frontend + backend in parallel)
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  
Storybook: `npm run storybook` → http://localhost:6006

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

### Server

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Azure SQL connection string | `Server=tcp:...` |
| `JWT_SECRET` | 32+ byte random secret for access tokens | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | Stripe server-side secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `CORS_ORIGIN` | Frontend URL (no trailing slash) | `http://localhost:5173` |
| `PORT` | Server port | `3001` |

### Client (must be prefixed `VITE_`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL |
| `VITE_SOCKET_URL` | Socket.io server URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |

> **Security:** `VITE_` variables are bundled into the frontend JS and visible to anyone. Never put secret keys here.

---

## Scripts

```bash
npm run dev             # Start web + server in parallel
npm run dev:web         # Frontend only
npm run dev:server      # Backend only
npm run build           # Build all packages
npm test                # Run all unit tests
npm run storybook       # Start Storybook
npm run test:e2e        # Run Playwright E2E tests (from apps/web/)
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — protected, deploys to Azure on push |
| `develop` | Integration branch — CI runs on every push |
| `feature/*` | Feature work — PR into develop |
| `milestone/*` | Milestone scaffolding — PR into develop |

---

## Milestones

- [x] **M1** — Project scaffolding, Redux store, GitHub repo, CI/CD skeleton
- [ ] **M2** — Auth (JWT + HttpOnly cookie refresh)
- [ ] **M3** — Form builder UI (drag-and-drop, 5 field types, multi-step)
- [ ] **M4** — Embeddable script + Shadow DOM
- [ ] **M5** — Stripe payment step + webhook
- [ ] **M6** — WebSocket live dashboard
- [ ] **M7** — Storybook documentation + a11y
- [ ] **M8** — Azure deployment
- [ ] **M9** — Full Playwright E2E suite

---

## Accessibility

- WCAG 2.1 AA target throughout
- Every field has a label, `aria-describedby` for help/error text
- Full keyboard navigation (builder + embedded form)
- `prefers-reduced-motion` respected globally
- axe DevTools verified at each milestone via Storybook a11y addon
- Focus ring always visible (never `outline: none` without replacement)

---

## Security Notes

- JWT access tokens live in Redux memory only — never `localStorage`
- Refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies
- Stripe webhook signature verified with raw body — see `server/src/middleware/rawBody.ts`
- All SQL queries use parameterized inputs via `mssql` — no string concatenation
- CORS restricted to `CORS_ORIGIN` env var

---

## License

MIT

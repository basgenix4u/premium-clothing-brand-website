# Vellum Storefront

A headless commerce storefront for a premium clothing brand — Next.js 16 App Router
over a Prisma/PostgreSQL API, with a catalogue, guest and signed-in carts, and an
idempotent checkout.

**Live:** <https://premium-clothing-brand.vercel.app>

**Source of truth for what is built:** [PRD.md](./PRD.md)

> This README describes what is **built today**. Everything planned lives in the PRD
> under *"Not built yet"*, and it stays there until it ships.

---

## What it is

`premium-clothing-brand-website` holds the Vellum storefront: a brand site with a
catalogue, product pages, looks, a journal and a bag, backed by a versioned JSON
API under `/api/v1`.

The repository is mid-port. The original Vite prototype still lives in
`legacy/vite-storefront/` and is the visual source of truth for the port; the Next
app in `src/` is where the code is moving. The task board in `docs/TASK_BOARD.md`
tracks exactly which pages have crossed over.

---

## The API

24 route handlers under `src/app/api/v1/`, all returning RFC 9457 problem documents
on failure.

| Area | Endpoints |
|---|---|
| Health | `GET /health/smoke`, `GET /health/live`, `GET /health/ready` (database check) |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Catalogue | `GET /categories`, `GET /products`, `GET /products/{slug}`, `GET /regions` |
| Content | `GET /looks`, `GET /journal`, `GET /journal/{slug}` |
| Bag | `GET /cart`, `POST /cart/items`, `DELETE /cart/items/{id}`, `POST /cart/promo`, `POST /cart/shipping` |
| Checkout & orders | `POST /checkout`, `GET /orders`, `GET /orders/{orderNumber}` |
| Security | `GET /security/csrf` (double-submit token) |

Security is built in rather than bolted on: argon2id password hashing with generic
failure messages and a decoy hash check, CSRF double-submit tokens plus origin
checks on unsafe methods, rate limits (10 per 15 min on login, 5 per hour on
registration), ownership checks on carts and orders, RFC 9457 errors from a
catch-all, security headers, and a `pino` logger that redacts secrets.

### Seeded catalogue

18 products, 37 variants, 7 categories, 4 looks, 3 journal articles, 6 regions and
2 promo codes. Money is stored as integer minor units (USD cents) and emails are
lowercased by the application.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4, the stylesheet ported rule-for-rule from the legacy prototype |
| Data | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`), three migrations |
| Validation | Zod 4 |
| Auth | argon2id, session cookies, CSRF double-submit |
| Server runtime | Structured `pino` logging with secret redaction |
| Client data | TanStack Query 5, region context, toast context |
| Tests | Vitest 3 (unit + integration), Playwright (Chromium) |
| Tooling | ESLint 10 flat config (type-checked, Next core-web-vitals, jsx-a11y), Prettier |

---

## Getting started

```bash
git clone https://github.com/basgenix4u/premium-clothing-brand-website.git
cd premium-clothing-brand-website
npm ci
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Requires Node ≥ 20.9. A local PostgreSQL is expected — the Docker Compose file is
part of Stage 5 and is not here yet.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server on `0.0.0.0:3000` |
| `npm run build` | `prisma generate` then `next build` |
| `npm run verify` | format:check → lint → typecheck → unit → integration → build |
| `npm run test` | Vitest unit tests |
| `npm run test:integration` | Vitest integration tests against PostgreSQL |
| `npm run e2e` | Playwright |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Seed the catalogue |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings tolerated |

### Tests

**19 test files, 146 cases** — 11 unit (pricing, promo, password, environment, HTTP
core and pipeline, schemas, catalogue service, cookies, client IP) and 8 integration
runs against a real PostgreSQL (auth, cart, catalogue, checkout, content, orders,
platform, smoke route) — plus a Playwright smoke spec.

---

## Configuration

`.env.example` is the contract. Runtime (`NODE_ENV`, `APP_URL`, `APP_VERSION`,
`LOG_LEVEL`), the database (`DATABASE_URL`) and secrets (`SESSION_SECRET`) are
validated at boot by Zod, which never echoes a value back.

## Documentation

| Document | What it is for |
|---|---|
| [PRD.md](./PRD.md) | **The source of truth.** What is built, what is not, and why. |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | The architecture review, data model, API contracts, and the recorded decisions behind them |
| [docs/TASK_BOARD.md](./docs/TASK_BOARD.md) | The canonical work board, stage by stage |
| `legacy/vite-storefront/README.md` | The prototype being ported — the visual reference for the Next app |

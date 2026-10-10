# Vellum Storefront — Master Task Board

Legend: `[ ]` Pending · `[~]` In Progress (only one at a time) · `[x]` Completed

Current stage: **Stage 3 — Backend (in progress)**. The only `[~]` item is the Stage 3 sign-off.

## Stage 0: Repository and baseline

- [x] Create repository `premium-clothing-brand-website` (private, then public as requested)
- [x] Configure Git identity and credential store (token kept out of the repo)
- [x] Import existing storefront code and push to `main`
- [x] Verify baseline: install, type-check (0 errors), build (passes)

## Stage 1: Architecture review and proposal

- [x] Review existing code and record findings (`docs/ARCHITECTURE.md` §2)
- [x] Approve architecture, schema, API contracts and folder structure (Option A, approved)
- [x] Resolve open decisions: D1 Option A, D2 USD base, D3 full scope. D4–D8 are deferred to the stages where they apply.

## Stage 2: Development environment

- [x] Create `package.json` (`vellum-storefront`), strict `tsconfig.json`, `.gitignore`, `.env.example`
- [x] Move the original Vite prototype to `legacy/vite-storefront/` for the Stage 4 port (excluded from build and lint)
- [x] Scaffold Next.js 16 App Router with TypeScript and Tailwind CSS 4
- [x] Configure ESLint 10 flat config (typescript-eslint type-checked, Next.js core web vitals, jsx-a11y) and Prettier
- [x] Configure Vitest with v8 coverage thresholds, and Playwright (Chromium)
- [x] Add env validation (Zod, never echoes values) and a structured pino logger with secret redaction
- [x] Add smoke endpoint `GET /api/v1/health/smoke` and liveness `GET /api/v1/health/live`
- [x] Add security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production)
- [x] Install dependencies non-interactively and verify: format, lint, type-check, 12/12 tests, 100% coverage on instrumented code, build, E2E smoke, and dev server probe
- [x] Approval gate for Stage 2 (approved by owner)

## Stage 3: Backend

Done in this stage so far: Prisma schema, migrations, seed, readiness, CSRF and origin checks, RFC 9457 errors, auth core, catalogue, bag, checkout, orders, and their tests. Decisions are recorded in `docs/ARCHITECTURE.md` §10.

- [x] Prisma schema and first migration, plus a CHECK-constraint migration (`docs/ARCHITECTURE.md` §5 and §10.1)
- [ ] PostgreSQL in Docker Compose for local development (the Compose file arrives in Stage 5; a local PostgreSQL is used now)
- [x] Seed script that imports the catalogue: 18 products, 37 variants, 7 categories, 4 looks, 3 articles, 6 regions, 3 promo codes (the earlier "37 products" was a miscount)
- [x] Readiness endpoint `GET /api/v1/health/ready` (database check)
- [x] CSRF double-submit tokens and origin checks on unsafe methods
- [x] RFC 9457 errors for handled failures and for unknown `/api` paths (catch-all route)
- [ ] RFC 9457 for wrong-method requests on known routes (Next.js returns its default 405 today; needs method-level middleware)
- [x] Rate limits on login (10 per 15 minutes) and registration (5 per hour)
- [x] Auth: register, login, logout, me (argon2id, generic failure messages, decoy hash check)
- [ ] Auth: password reset with a single-use token, and revocation of other sessions on reset
- [ ] Session rotation policy beyond per-login tokens (decide with password reset; see ARCHITECTURE §10.5)
- [x] Ownership checks on carts and orders (guest cookie or signed-in user only)
- [ ] Role guards for admin routes (needs the admin module)
- [x] Catalogue API: categories, products with filters, sort, search, and offset cursors
- [ ] Catalogue API: looks, journal and size guides
- [x] Bag API: guest cookie bag, server-side totals, promo validation, shipping selection, merge on sign-in
- [ ] Decision: CIRCLE15 is described as a members offer, but there is no membership model (ARCHITECTURE §10.3)
- [ ] Wishlist module
- [x] Checkout: idempotent order creation (`Idempotency-Key`) with transactional stock reservation and a concurrency test
- [ ] Checkout: release reserved stock for unpaid orders (scheduled job)
- [ ] Payment adapter interface and webhook handler (HMAC verification, event idempotency). No live provider yet.
- [ ] Reviews module with moderation
- [ ] Newsletter (double opt-in) and contact module
- [ ] Admin module: products, stock, orders, promo codes, review moderation, audit log
- [x] Unit tests: pricing, promo, password, environment, HTTP core and pipeline, schemas, catalogue service, cookies, client IP
- [ ] Unit tests: stock and validation rules for bag and checkout services
- [x] Integration tests for the implemented routes (catalogue, auth, bag, checkout, orders, platform) against PostgreSQL
- [ ] Integration tests for wishlist, reviews, newsletter, contact, admin and payments
- [~] Stage 3 sign-off: all tests green, zero TS, lint and build errors, docs and board updated, pushed to `main`
- [ ] Approval gate for Stage 3 (wait for owner approval)

## Stage 4: Frontend

- [ ] Port the existing UI components, CSS and copy from `legacy/vite-storefront/` to Next.js routes, keeping the current visual design
- [ ] Replace hash routing with real URLs and metadata for SEO
- [ ] Replace `catalog.ts` and `localStorage` state with API integration (TanStack Query)
- [ ] Loading, empty and error states on every data view
- [ ] Authentication flow: register, login, account, reset password
- [ ] Admin dashboard UI (role guarded)
- [ ] Consent banner and analytics gated by consent
- [ ] Self-host fonts and images (remove Google Fonts and Pexels hotlinking); enforce Content Security Policy
- [ ] Visual regression check: screenshots of ported pages compared with the legacy prototype
- [ ] Accessibility pass (keyboard, focus, contrast, ARIA) with axe checks
- [ ] Responsive QA on mobile, tablet and desktop
- [ ] E2E tests: browse, bag, checkout (stubbed payment), account
- [ ] Delete `legacy/vite-storefront/` once the port is verified
- [ ] Zero TypeScript, lint and build errors
- [ ] Approval gate for Stage 4

## Stage 5: Production readiness

- [ ] Re-enable `output: "standalone"` in `next.config.ts` for the Docker image (removed in Stage 2 because it conflicts with `next start`)
- [ ] Multi-stage `Dockerfile` (non-root user, minimal image)
- [ ] `docker-compose.yml` for local development and `docker-compose.prod.yml`
- [ ] GitHub Actions CI: install, format, lint, type-check, unit, integration, E2E, audit, build, Docker
- [ ] GitHub Actions release workflow: versioned image and GitHub Release
- [ ] Dependabot and CodeQL configuration
- [ ] Choose hosting target (decision D4)
- [ ] `.env.example` complete and documented
- [ ] `README.md` (overview, quick start, scripts, architecture link)
- [ ] `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/API.md`
- [ ] Draft privacy, terms and accessibility pages (owner review required)
- [ ] Tag `v1.0.0`, create release notes and `CHANGELOG.md`
- [ ] Final approval gate and handover

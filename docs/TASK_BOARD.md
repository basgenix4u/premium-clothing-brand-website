# Vellum Storefront — Master Task Board

Legend: `[ ]` Pending · `[~]` In Progress (only one at a time) · `[x]` Completed

Current stage: **Stage 2 — awaiting approval** (the only item in progress is the approval gate).

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
- [~] Approval gate for Stage 2 (waiting for owner approval)

## Stage 3: Backend

- [ ] Prisma schema and first migration (`docs/ARCHITECTURE.md` §5), PostgreSQL in Docker Compose for local development
- [ ] Seed script that imports the current 37 products, categories, looks and articles
- [ ] Readiness endpoint `GET /api/v1/health/ready` (database check)
- [ ] Security middleware: CSRF, origin checks, rate limits, RFC 9457 errors on all API routes (including unknown routes)
- [ ] Auth module: register, login, logout, me, password reset (argon2id, session rotation)
- [ ] Authorisation: role guards and ownership checks
- [ ] Catalogue module: categories, products with filters and cursor pagination, search, looks, journal, size guides
- [ ] Cart module: guest cookie cart, server-side totals, promo validation, shipping selection, merge on login
- [ ] Wishlist module
- [ ] Checkout module: idempotent order creation with transactional stock reservation
- [ ] Payment adapter interface and webhook handler (HMAC verification, event idempotency). No live provider yet.
- [ ] Reviews module with moderation
- [ ] Newsletter (double opt-in) and contact module
- [ ] Admin module: products, stock, orders, promo codes, review moderation, audit log
- [ ] Unit tests for pricing, promo, stock and validation rules
- [ ] Integration tests for all API routes against PostgreSQL
- [ ] Bug fixes and stage sign-off (all tests green)

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

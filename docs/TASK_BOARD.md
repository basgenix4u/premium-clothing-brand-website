# Vellum Storefront — Master Task Board

Legend: `[ ]` Pending · `[~]` In Progress (only one at a time) · `[x]` Completed

Last updated: Stage 1 (architecture review)

## Stage 0: Repository and baseline
- [x] Create repository `premium-clothing-brand-website` (private, then public as requested)
- [x] Configure Git identity and credential store (token kept out of the repo)
- [x] Import existing storefront code and push to `main`
- [x] Verify baseline: install, type-check (0 errors), build (passes)
- [x] Add `.gitignore`

## Stage 1: Architecture review and proposal
- [~] Review existing code and record findings (`docs/ARCHITECTURE.md` §2)
- [ ] Approve architecture option, database schema, API contracts and folder structure (`docs/ARCHITECTURE.md` §3–§7)
- [ ] Resolve open decisions D1–D8 (`docs/ARCHITECTURE.md` §9)

## Stage 2: Development environment
- [ ] Create `package.json` (rename to `vellum-storefront`), `tsconfig.json` (strict), `.gitignore`, `.env.example`
- [ ] Scaffold Next.js App Router with TypeScript
- [ ] Configure ESLint (typescript-eslint, React, jsx-a11y), Prettier and editor settings
- [ ] Configure Vitest and Playwright
- [ ] Add env validation (Zod) and structured logger (pino)
- [ ] Add smoke-test endpoint `GET /api/v1/health/smoke`
- [ ] Install dependencies non-interactively and verify lint, type-check, test and build
- [ ] Approval gate for Stage 2

## Stage 3: Backend
- [ ] Prisma schema and first migration (`docs/ARCHITECTURE.md` §5)
- [ ] Seed script that imports the current 37 products, categories, looks and articles
- [ ] Security middleware: CSRF, origin checks, rate limits, security headers, RFC 9457 errors
- [ ] Auth module: register, login, logout, me, password reset (argon2id, session rotation)
- [ ] Authorisation: role guards and ownership checks
- [ ] Catalogue module: categories, products with filters and cursor pagination, search, looks, journal, size guides
- [ ] Cart module: guest cookie cart, server-side totals, promo validation, shipping selection, merge on login
- [ ] Wishlist module
- [ ] Checkout module: idempotent order creation with transactional stock reservation
- [ ] Payment adapter interface, webhook handler with HMAC verification and event idempotency (no live provider yet)
- [ ] Reviews module with moderation
- [ ] Newsletter (double opt-in) and contact module
- [ ] Admin module: products, stock, orders, promo codes, review moderation, audit log
- [ ] Unit tests for pricing, promo, stock and validation rules
- [ ] Integration tests for all API routes against PostgreSQL
- [ ] Bug fixes and stage sign-off (all tests green)

## Stage 4: Frontend
- [ ] Port existing UI components and styles to Next.js routes
- [ ] Replace hash routing with real URLs and metadata for SEO
- [ ] Replace `catalog.ts` and `localStorage` state with API integration (TanStack Query)
- [ ] Loading, empty and error states on every data view
- [ ] Authentication flow: register, login, account, reset password
- [ ] Admin dashboard UI (role guarded)
- [ ] Consent banner and analytics gated by consent
- [ ] Self-host fonts and images; enforce CSP
- [ ] Remove single-file build; verify caching headers
- [ ] Accessibility pass (keyboard, focus, contrast, ARIA) with axe checks
- [ ] Responsive QA on mobile, tablet and desktop
- [ ] E2E tests: browse, bag, checkout (stubbed payment), account
- [ ] Zero TypeScript, lint and build errors
- [ ] Approval gate for Stage 4

## Stage 5: Production readiness
- [ ] Multi-stage `Dockerfile` (non-root user, minimal image)
- [ ] `docker-compose.yml` for local development and `docker-compose.prod.yml`
- [ ] GitHub Actions CI: install, lint, type-check, unit, integration, E2E, audit, build, Docker
- [ ] GitHub Actions release workflow: versioned image and GitHub Release
- [ ] Dependabot and CodeQL configuration
- [ ] `.env.example` complete and documented
- [ ] `README.md` (overview, quick start, scripts, architecture link)
- [ ] `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/API.md`
- [ ] Draft privacy, terms and accessibility pages (owner review required)
- [ ] Tag `v1.0.0`, create release notes and `CHANGELOG.md`
- [ ] Final approval gate and handover

# Vellum Storefront — Product Requirements

**Status:** in development (Stage 4, frontend) · **Last updated:** 2026-10-18 · **Owner:** Abdulbasit Abdulalim
**Live:** <https://premium-clothing-brand.vercel.app> · **Repository:** `basgenix4u/premium-clothing-brand-website`

---

## 0. The rule this document follows

> **This document describes what is built. Everything else is in the section headed
> "Not built yet", and it stays there until it is.**

Every claim below was checked against the code in this repository — a route handler, a
Prisma model, a migration, a test, or a passing command. The full architecture
review is in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); the stage-by-stage
board is in [`docs/TASK_BOARD.md`](./docs/TASK_BOARD.md).

---

## 1. What it is

A headless commerce storefront for a premium clothing brand, on Next.js 16 App
Router over a Prisma/PostgreSQL API. The customer-facing surface is a brand site
with a catalogue, product pages, looks and a journal, plus a bag and a checkout. The
API is versioned under `/api/v1` and returns RFC 9457 problem documents on failure.

The repository is mid-port: the original Vite prototype lives in
`legacy/vite-storefront/` and is the visual source of truth, and the Next app in
`src/` is where the code is moving.

---

## 2. What is built

### 2.1 The API

**24 route handlers** under `src/app/api/v1/`, organised into seven server modules
(`auth`, `catalog`, `cart`, `checkout`, `content`, `health`, `orders`).

| Area | Endpoints | Notes |
|---|---|---|
| Health | `GET /health/smoke`, `GET /health/live`, `GET /health/ready` | `/ready` performs a database check |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | argon2id, generic failure messages, decoy hash check |
| Catalogue | `GET /categories`, `GET /products`, `GET /products/{slug}`, `GET /regions` | Filters, sort, search, offset cursors; product listings include variants with swatches, images and per-size stock; regions carry the FX rate for display only |
| Content | `GET /looks`, `GET /journal`, `GET /journal/{slug}` | Ordered by a curated `sortOrder` (migration `content_sort_order`) |
| Bag | `GET /cart`, `POST /cart/items`, `DELETE /cart/items/{id}`, `POST /cart/promo`, `POST /cart/shipping` | Guest cookie bag, server-side totals, promo validation, shipping selection, merged on sign-in |
| Checkout | `POST /checkout` | Idempotent order creation via `Idempotency-Key`, with transactional stock reservation and a concurrency test |
| Orders | `GET /orders`, `GET /orders/{orderNumber}` | Ownership checked against the guest cookie or the signed-in user |
| Security | `GET /security/csrf` | Double-submit token for unsafe methods |

Every other API path returns an RFC 9457 problem document through a catch-all
route, and the response carries a request id.

### 2.2 The data model

**25 Prisma models** and 8 enums, in three migrations (init, check constraints,
content sort order). Money is stored as integer minor units (USD cents); emails are
lowercased by the application.

The models, in groups:

| Group | Models |
|---|---|
| Identity | `User`, `Session`, `PasswordResetToken` |
| Commerce | `Cart`, `CartItem`, `WishlistItem`, `Order`, `OrderItem`, `Payment`, `PaymentEvent` |
| Catalogue | `Category`, `Product`, `ProductVariant`, `VariantSize`, `Look`, `Article` |
| Geography and fulfilment | `Region`, `Address`, `ShippingMethod` |
| Marketing | `PromoCode`, `Review`, `NewsletterSubscriber`, `ContactMessage` |
| Governance | `AuditLog` |

Enums: `UserRole`, `Audience`, `Badge`, `PromoKind`, `OrderStatus`, `PaymentStatus`,
`ReviewStatus`, `SubscriberStatus`.

### 2.3 The seeded catalogue

18 products, 37 variants, 7 categories, 4 looks, 3 journal articles, 6 regions and
2 promo codes. `CIRCLE15` is deliberately **not** seeded until a membership model
exists — an owner decision recorded in `docs/ARCHITECTURE.md` §10.3.

### 2.4 The security posture

This is built, not planned:

- argon2id password hashing, with generic failure messages and a decoy hash check so
  a timing difference cannot distinguish "no such user" from "wrong password".
- CSRF double-submit tokens plus an origin check on unsafe methods.
- Rate limits: 10 login attempts per 15 minutes, 5 registrations per hour.
- Ownership checks on carts and orders.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, and HSTS in production.
- A `pino` logger with secret redaction, and Zod environment validation that never
  echoes a value.

### 2.5 The frontend

Ported from the legacy prototype, keeping the current visual design:

| Ported | Detail |
|---|---|
| Stylesheet | `src/app/globals.css`, ported rule-for-rule from `legacy/vite-storefront/src/index.css` — formatted only, no rule changes |
| Shared UI | `src/components/ui/` — buttons, icons, overlays, photo, feedback, toaster, reveal transitions |
| Providers | `src/features/app-providers.tsx` — TanStack Query, region context, toast context |
| Shell | Header with mega menu and mobile menu, footer, root layout with a skip link |
| Catalogue | Product card and quick view, with add-to-bag going through the API |
| Home | The home page: hero, discovery sections, story sections, look section, journal circle, FAQ |

Deliberately deferred on the home page: the reviews block, recently viewed, the
manifesto outfit builder (arrives with Discover) and newsletter submission (the
endpoint is not built).

### 2.6 The toolchain and tests

ESLint 10 flat config (type-checked, Next core-web-vitals, jsx-a11y), Prettier,
Vitest 3 with V8 coverage thresholds, Playwright on Chromium, and a `verify` script:
format:check → lint → typecheck → unit → integration → build.

**19 test files, 146 cases**: 11 unit (pricing, promo, password, environment, HTTP
core and pipeline, schemas, catalogue service, cookies, client IP) and 8 integration
runs against a real PostgreSQL (auth, cart, catalogue, checkout, content, orders,
platform, smoke route), plus a Playwright smoke spec.

---

## 3. Decisions that are locked

| Ref | Decision |
|---|---|
| D1 | Architecture: **Option A** — Next.js, not Vite + Fastify |
| D2 | **USD base currency.** Multi-currency kept, with server-side FX; the region rate is for display only |
| D3 | **Full scope** — storefront, customer accounts and admin. The current visual design is preserved through the port |
| D4 | Hosting: Docker on a VPS or a managed container host. **To be decided before Stage 5** |
| D5 | Payments: Paystack for NGN (cards, transfer, USSD). Adapter interface now, **no live keys** |
| D6 | Product photography: replace the Pexels stock images with brand photography before launch; placeholders until then |
| D7 | Legal pages: draft placeholder policies now; the business owner must review them before launch |
| D8 | Licence: proprietary, all rights reserved, unless you choose otherwise |
| §10.3 | `CIRCLE15` is not seeded until a membership model exists; duplicate sign-up returns 409 |
| §10.5 | Session rotation is decided together with password reset |

---

## 4. Acceptance criteria for v1

A release is v1 when all of the following are true:

1. `npm run verify` passes: format, lint, typecheck, unit tests, integration tests
   and build are clean.
2. A customer can browse the catalogue, open a product, add it to the bag, apply a
   promo code, choose shipping and check out — and the order is created once, even
   if the request is retried.
3. Stock is reserved transactionally at checkout and a concurrent second checkout
   cannot oversell.
4. A guest bag survives sign-in, and a user cannot read or mutate another user's
   cart or orders.
5. Unsafe methods without a valid CSRF token or from a foreign origin are rejected.
6. Login and registration rate limits hold.
7. Every error response is an RFC 9457 problem document, and no response leaks a
   secret, a stack trace or a provider status code.
8. The ported pages match the legacy prototype visually, and the accessibility pass
   (keyboard, focus, contrast, ARIA) is green under axe.
9. The README and this document describe the same product, and everything deferred
   is in §5.

---

## 5. Not built yet

Everything in this section is planned and **not** in the running product. It is
quoted from the canonical board, [`docs/TASK_BOARD.md`](./docs/TASK_BOARD.md).

### 5.1 Frontend

- The search overlay, the cart and wishlist drawers, and the shop, product, journal,
  lookbook, quiz and wishlist pages.
- Real URLs and metadata for SEO, replacing hash routing.
- API integration (TanStack Query) in place of the `catalog.ts` and `localStorage`
  state.
- Loading, empty and error states on every data view.
- The authentication flow: register, login, account and password reset.
- The admin dashboard UI, role guarded.
- A consent banner, with analytics gated by consent.
- Self-hosted fonts and images — no Google Fonts, no Pexels hotlinking — and a
  Content Security Policy.
- A visual regression check: screenshots of the ported pages compared with the
  legacy prototype.
- An accessibility pass with axe, and responsive QA on mobile, tablet and desktop.
- E2E tests for browse, bag, checkout with a stubbed payment, and account.
- Deleting `legacy/vite-storefront/` once the port is verified.

### 5.2 Backend

- Password reset with a single-use token, and revocation of other sessions on reset.
- The session rotation policy beyond per-login tokens.
- RFC 9457 for wrong-method requests on known routes — Next.js still returns its
  default 405, which needs method-level middleware.
- Releasing reserved stock for unpaid orders (a scheduled job).
- The payment adapter interface and webhook handler: HMAC verification and event
  idempotency. **No live provider yet.**
- The reviews module, with moderation.
- The newsletter module with double opt-in, and the contact module.
- The wishlist module.
- The admin module: products, stock, orders, promo codes, review moderation, audit
  log.
- Unit tests for the stock and validation rules of the bag and checkout services.
- Integration tests for wishlist, reviews, newsletter, contact, admin and payments.

### 5.3 Operations

- Re-enabling `output: "standalone"` in `next.config.ts` for the Docker image.
- A multi-stage `Dockerfile` with a non-root user and a minimal image.
- `docker-compose.yml` for local development and `docker-compose.prod.yml`.
- GitHub Actions CI: install, format, lint, typecheck, unit, integration, E2E,
  audit, build, Docker.
- A GitHub Actions release workflow: versioned image and GitHub Release.
- Dependabot and CodeQL configuration.

---

## 6. Open questions

1. **D4 — where does this run in production?** A VPS with Docker or a managed
   container host. It must be decided before Stage 5, because the Dockerfile and the
   CI build depend on it.
2. **D5 — the payment provider.** Paystack is the recorded preference for NGN, but
   there is no live integration, so the checkout currently stops at order creation.
3. **D6 — photography.** The catalogue still uses stock images. Placeholders are fine
   in development; they are not fine at launch.
4. **D7 — legal pages.** Placeholder policies need the business owner's review
   before launch.
5. **Stock release for unpaid orders.** A scheduled job is the obvious answer, but
   the job's owner and schedule are undecided.

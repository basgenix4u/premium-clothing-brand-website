# Vellum Storefront — Architecture Proposal

**Status:** Approved on 2026-10-10 (Option A, USD base currency, full launch scope). Stage 2 environment is set up.
**Repository:** `basgenix4u/premium-clothing-brand-website`
**Baseline:** commit `2f0be4d` (existing React + Vite storefront, imported unchanged)

---

## 1. Source of truth and assumptions

No formal PRD was supplied. Requirements are derived from the existing storefront code, which already defines the intended product: a premium clothing brand with catalogue, lookbook, journal, style quiz, wishlist, bag, promo codes, shipping by region, reviews, size guide and newsletter.

Assumptions (to be confirmed in the approval gate):

1. The site is a single brand storefront ("Vellum"), not a marketplace.
2. Customers can shop as guests, and can optionally create an account to see order history and wishlist.
3. An admin dashboard is needed to manage products, stock, orders, promo codes and review moderation.
4. Payments are deferred. The checkout flow is designed with a provider-agnostic payment adapter, and no card data touches our servers.

---

## 2. Current state review

### 2.1 Verified baseline

| Check                         | Result             |
| ----------------------------- | ------------------ |
| `npm ci`                      | Passes             |
| `tsc --noEmit` (strict)       | 0 errors           |
| `vite build`                  | Passes (about 2 s) |
| Tests / lint / formatter / CI | None present       |

### 2.2 Findings (gaps and inconsistencies)

| #   | Area            | Finding                                                                                                                                              | Severity              | Resolution in proposal                                                                                    |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| F1  | Data            | Products, stock, prices, promo rules and shipping live in `src/data/catalog.ts`. Cart, wishlist and reviews live in `localStorage`.                  | Critical              | Move all data to PostgreSQL. Server is authoritative for price, stock, promo and totals.                  |
| F2  | Commerce        | No order, payment or customer model. Checkout cannot take payment.                                                                                   | Critical              | Orders and payments modules, with an idempotent checkout API.                                             |
| F3  | Reviews         | Reviews are stored per browser, so other customers never see them.                                                                                   | High                  | Reviews table with server-side moderation.                                                                |
| F4  | Routing         | Hash routing (`#/shop`).                                                                                                                             | High                  | Real URLs for SEO, sharing and analytics.                                                                 |
| F5  | Security        | No authentication, CSRF, CSP, rate limiting or input validation layer.                                                                               | High                  | Section 4 (OWASP mapping).                                                                                |
| F6  | Third parties   | Google Fonts and Pexels images are loaded directly from the browser.                                                                                 | Medium                | Self-host fonts and images. Add a CSP. Reduces privacy exposure and third-party dependency.               |
| F7  | Privacy / legal | Analytics events are pushed to `dataLayer` with no consent mechanism. Privacy, terms and accessibility pages are not published (the footer says so). | High (launch blocker) | Consent banner. Draft policy pages. Nigeria Data Protection Act 2023 alignment.                           |
| F8  | Build           | `vite-plugin-singlefile` inlines the whole bundle (about 394 kB) into `index.html`.                                                                  | Medium                | Remove from production build. Use normal asset hashing and caching.                                       |
| F9  | Tooling         | No tests, ESLint, Prettier, CI or `.env` handling. The package name `react-vite-tailwind` is a template leftover.                                    | Medium                | Stage 2 tooling. Rename to `vellum-storefront`.                                                           |
| F10 | Placeholders    | `hello@vellum.example`, the "Demonstration storefront" footer disclaimer, and demo stock and delivery data.                                          | Medium                | Replace with real config. Remove disclaimer at launch.                                                    |
| F11 | Currency        | Prices are in USD, with fixed FX rates for six currencies. The brand is based in Nigeria.                                                            | Decision needed       | See open decision D2.                                                                                     |
| F12 | Fit             | Client code is well factored: data is isolated in `commerce.ts`, and `store.tsx` is the single state layer.                                          | Positive              | Business logic moves to the server with the same function boundaries. Components port with little change. |

---

## 3. Recommended system architecture

### 3.1 Options

|                             | Option A (recommended)                                      | Option B                                           |
| --------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Stack                       | Next.js (App Router, TypeScript) + PostgreSQL + Prisma      | React + Vite (existing) + Fastify API + PostgreSQL |
| SEO and shareable URLs      | Server-rendered product, journal and lookbook pages         | Client-rendered. Needs prerendering later.         |
| Deployables                 | One Docker image (UI and API)                               | Two (static site and API)                          |
| Reuse of current code       | Components port as client components. Routing is rewritten. | Almost all code is reused.                         |
| Fit for a clothing retailer | Strong. Product pages must rank in search.                  | Acceptable for a demo, weaker for growth.          |

**Recommendation: Option A.** Product discovery depends on search engines, and the current hash routing cannot provide that. A single deployable also simplifies CI/CD and hosting.

### 3.2 Logical architecture (Option A)

```
                 ┌──────────────────────────────────────────────┐
  Browser  ───►  │  Next.js app (single container)              │
  (RSC + CC)     │                                              │
                 │  Presentation  src/app, src/components        │
                 │  Client state  TanStack Query + small stores  │
                 │  HTTP API      src/app/api/v1/* (Route Handlers)│
                 │     │ Zod validation, auth, CSRF, rate limit  │
                 │  Application   src/server/modules/*/service   │
                 │  Domain        pricing, promo, stock rules    │
                 │  Infra         Prisma repos, payment adapter, │
                 │                email adapter, logger          │
                 └───────┬───────────────────────┬──────────────┘
                         │                       │
                  PostgreSQL 16            Payment provider (later)
                  (Prisma migrations)      Email provider (later)
```

Dependency rule: the domain layer has no imports from Next.js, Prisma or HTTP. Application services depend on repository interfaces, and infrastructure implements them (dependency inversion).

### 3.3 Key design decisions

- **Money** is stored as integer minor units with an ISO 4217 currency code. No floating point.
- **Pricing and totals** are computed only on the server. The client sends IDs and quantities, never prices.
- **Guest carts** use an opaque, random, httpOnly cookie that maps to a server-side cart. On login, the guest cart merges into the user cart.
- **Checkout** requires an `Idempotency-Key` header, so retries never create duplicate orders.
- **Stock** is reserved in the same transaction as order creation, using `UPDATE ... WHERE stock >= qty`. Stock never goes negative.
- **Payments** sit behind a `PaymentProvider` interface. Webhooks are verified with HMAC signatures and processed idempotently.
- **Reviews** start as `pending` and are published after moderation. Text is stored as plain text and escaped on output.
- **Observability:** structured JSON logs (pino) with redaction of secrets and PII. `/api/v1/health/live` and `/api/v1/health/ready` endpoints.
- **Hosting target:** any Docker host. The choice is open decision D4.

---

## 4. Security design (OWASP Top 10 mapping)

| Risk                          | Controls                                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken access control     | Role-based access (`customer`, `admin`). Ownership checks on carts, orders and wishlists. Deny by default in middleware.                                                     |
| A02 Cryptographic failures    | Passwords hashed with argon2id. Tokens stored only as SHA-256 hashes. HSTS over TLS. Secrets only from environment variables.                                                |
| A03 Injection                 | Prisma parameterised queries only, with no raw SQL in application code. Zod validation at every boundary. React output escaping.                                             |
| A04 Insecure design           | Server-side price, stock and promo validation. Threat model in `docs/SECURITY.md`. Rate limits on auth, checkout and review endpoints.                                       |
| A05 Security misconfiguration | Strict CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Env validated at boot. `X-Powered-By` disabled.                                               |
| A06 Vulnerable components     | Lockfile committed. `npm audit` in CI. Dependabot enabled.                                                                                                                   |
| A07 Authentication failures   | Session cookies: `httpOnly`, `Secure`, `SameSite=Lax`. Session rotation on login. Login throttling. Generic error messages. Password reset tokens are single-use and expire. |
| A08 Integrity failures        | Webhook HMAC verification. Pinned GitHub Actions versions. Signed release images.                                                                                            |
| A09 Logging and monitoring    | Structured logs with redaction. Audit log for every admin write. Error tracking hook.                                                                                        |
| A10 SSRF                      | No user-supplied URLs are fetched server-side.                                                                                                                               |
| CSRF                          | `SameSite=Lax` cookies, plus Origin/`Sec-Fetch-Site` checks on all state-changing requests.                                                                                  |
| XSS                           | No `dangerouslySetInnerHTML`. Review text is sanitised on input and escaped on output. CSP with no inline scripts.                                                           |
| Command injection             | No shell execution in the application.                                                                                                                                       |
| Sensitive data exposure       | Card data never reaches our servers (hosted or tokenised payment). PII is minimised. Retention rules are documented.                                                         |

---

## 5. Database schema (PostgreSQL, Prisma)

All primary keys are UUIDs. All tables have `created_at`, and mutable tables also have `updated_at`.

```sql
-- Identity
users(id, email CITEXT UNIQUE, password_hash, full_name, role ENUM('customer','admin'),
      email_verified_at, created_at, updated_at)
sessions(id, user_id FK, token_hash UNIQUE, expires_at, user_agent, ip_hash, revoked_at)
password_reset_tokens(id, user_id FK, token_hash UNIQUE, expires_at, used_at)
addresses(id, user_id FK, label, line1, line2, city, region, postal_code, country CHAR(2), phone)

-- Catalogue
categories(id, slug UNIQUE, name, blurb, image_url, sort_order)
products(id, slug UNIQUE, name, description, category_id FK, audience ENUM('women','men','unisex'),
         styles TEXT[], badge ENUM('new','bestseller','limited') NULL, base_price_minor INT CHECK(>=0),
         currency CHAR(3), is_published BOOL, released_at, created_at, updated_at)
  INDEX(category_id, is_published), INDEX(released_at)
product_variants(id, product_id FK, sku UNIQUE, colour_id, price_minor INT CHECK(>=0), is_active)
  INDEX(product_id)
variant_sizes(variant_id FK, size_code, stock INT CHECK(stock >= 0), version INT,
              PRIMARY KEY(variant_id, size_code))
product_images(id, variant_id FK, url, alt_text, sort_order)
looks(id, slug UNIQUE, title, image_url, product_ids UUID[], published_at)
articles(id, slug UNIQUE, title, body_markdown, published_at)
size_guides(id, region, measurements JSONB)

-- Commerce
promo_codes(id, code CITEXT UNIQUE, kind ENUM('percent','fixed','shipping'), value_minor_or_bp INT,
            min_subtotal_minor INT, starts_at, ends_at, usage_limit INT NULL, used_count INT, is_active)
shipping_methods(id, region_code CHAR(2), label, eta_text, price_minor INT, currency CHAR(3), is_active)
carts(id, user_id FK NULL, guest_token_hash UNIQUE NULL, updated_at)
cart_items(id, cart_id FK, variant_id FK, size_code, quantity INT CHECK(quantity > 0),
           UNIQUE(cart_id, variant_id, size_code))
wishlist_items(user_id FK, variant_id FK, notify_when_back BOOL, created_at,
               PRIMARY KEY(user_id, variant_id))
orders(id, order_number UNIQUE, user_id FK NULL, email CITEXT, status ENUM('pending_payment','paid',
       'fulfilled','cancelled','refunded'), currency CHAR(3), subtotal_minor, discount_minor,
       shipping_minor, total_minor, promo_code_id FK NULL, shipping_method_id FK,
       shipping_address JSONB, idempotency_key UNIQUE, created_at, updated_at)
order_items(id, order_id FK, variant_id FK NULL, sku_snapshot, name_snapshot, size_code,
            unit_price_minor, quantity)            -- snapshots keep history stable
payments(id, order_id FK, provider, provider_reference UNIQUE, status, amount_minor, currency,
         created_at, updated_at)                    -- no card data stored
payment_events(id, provider, event_id UNIQUE, payload JSONB, received_at)   -- webhook idempotency

-- Engagement
reviews(id, product_id FK, user_id FK NULL, author_name, rating SMALLINT CHECK(1..5), title, body,
        status ENUM('pending','approved','rejected'), created_at)
  INDEX(product_id, status)
newsletter_subscribers(id, email CITEXT UNIQUE, status ENUM('pending','confirmed','unsubscribed'),
                       consent_at, confirm_token_hash, confirmed_at)
contact_messages(id, name, email, message, created_at, ip_hash)

-- Governance
audit_logs(id, actor_id FK NULL, action, entity, entity_id, metadata JSONB, created_at)
```

Migrations are managed with Prisma Migrate. Seed data is generated from the existing `catalog.ts`, so the current 18 products (37 variants) carry over. The snapshot is `src/server/db/seed/catalog.seed.json`. The count of 37 that appeared in the Stage 1 proposal was the variant count, not the product count.

---

## 6. API contracts (REST, `/api/v1`)

**Conventions**

- JSON request and response bodies. Errors use RFC 9457 `application/problem+json`.
- Money is returned as `{ "amountMinor": 12500, "currency": "NGN" }`.
- Lists use cursor pagination: `?cursor=&limit=` (max 100). Responses include `nextCursor`.
- Mutating requests require `Content-Type: application/json`, a valid Origin, and an `X-CSRF-Token` header (double-submit cookie).
- Checkout requires an `Idempotency-Key` header.
- Auth: session cookie. Public endpoints are marked **Public**.

| Method                | Path                            | Auth                             | Purpose                                                                                                    |
| --------------------- | ------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| GET                   | `/health/live`                  | Public                           | Liveness probe                                                                                             |
| GET                   | `/health/ready`                 | Public                           | Readiness, including DB check                                                                              |
| GET                   | `/health/smoke`                 | Public                           | Smoke test: app, config and DB round-trip                                                                  |
| POST                  | `/auth/register`                | Public                           | Create customer account                                                                                    |
| POST                  | `/auth/login`                   | Public                           | Start session (rate limited)                                                                               |
| POST                  | `/auth/logout`                  | Customer                         | End session                                                                                                |
| GET                   | `/auth/me`                      | Customer                         | Current user                                                                                               |
| POST                  | `/auth/password-reset`          | Public                           | Request reset (always returns 202)                                                                         |
| POST                  | `/auth/password-reset/confirm`  | Public                           | Set new password with single-use token                                                                     |
| GET                   | `/categories`                   | Public                           | Category list                                                                                              |
| GET                   | `/products`                     | Public                           | Filter by `category`, `style`, `audience`, `size`, `colour`, `minPrice`, `maxPrice`, `q`, `sort`, `cursor` |
| GET                   | `/products/{slug}`              | Public                           | Product detail with variants and stock                                                                     |
| GET                   | `/products/{slug}/related`      | Public                           | Related products                                                                                           |
| GET                   | `/search/suggestions?q=`        | Public                           | Typeahead                                                                                                  |
| GET                   | `/looks`                        | Public                           | Lookbook                                                                                                   |
| GET                   | `/looks/{slug}`                 | Public                           | Look detail                                                                                                |
| GET                   | `/journal`                      | Public                           | Article list                                                                                               |
| GET                   | `/journal/{slug}`               | Public                           | Article detail                                                                                             |
| GET                   | `/size-guides/{region}`         | Public                           | Size chart                                                                                                 |
| GET                   | `/cart`                         | Public (guest cookie or session) | Current cart with server-computed totals                                                                   |
| POST                  | `/cart/items`                   | Public                           | Add `{ variantId, sizeCode, quantity }`                                                                    |
| PATCH                 | `/cart/items/{id}`              | Public                           | Change quantity                                                                                            |
| DELETE                | `/cart/items/{id}`              | Public                           | Remove line                                                                                                |
| PUT                   | `/cart/promo`                   | Public                           | Apply `{ code }` (validated server-side)                                                                   |
| DELETE                | `/cart/promo`                   | Public                           | Remove promo                                                                                               |
| PUT                   | `/cart/shipping`                | Public                           | Select `{ shippingMethodId }`                                                                              |
| POST                  | `/cart/merge`                   | Customer                         | Merge guest cart into user cart on login                                                                   |
| GET                   | `/wishlist`                     | Customer                         | List wishlist                                                                                              |
| PUT                   | `/wishlist/{variantId}`         | Customer                         | Add or update `notifyWhenBack`                                                                             |
| DELETE                | `/wishlist/{variantId}`         | Customer                         | Remove                                                                                                     |
| GET                   | `/products/{slug}/reviews`      | Public                           | Approved reviews, cursor paged                                                                             |
| POST                  | `/products/{slug}/reviews`      | Public (rate limited)            | Submit review, status `pending`                                                                            |
| POST                  | `/checkout`                     | Public                           | Create order from cart. Requires `Idempotency-Key`. Returns payment instruction.                           |
| POST                  | `/webhooks/payments/{provider}` | Provider signature               | Payment status updates                                                                                     |
| GET                   | `/orders`                       | Customer                         | Order history                                                                                              |
| GET                   | `/orders/{orderNumber}`         | Owner or guest token             | Order detail                                                                                               |
| POST                  | `/newsletter`                   | Public (rate limited)            | Subscribe (double opt-in)                                                                                  |
| GET                   | `/newsletter/confirm?token=`    | Public                           | Confirm subscription                                                                                       |
| DELETE                | `/newsletter`                   | Public                           | Unsubscribe with signed link                                                                               |
| POST                  | `/contact`                      | Public (rate limited)            | Contact message                                                                                            |
| GET/POST/PATCH/DELETE | `/admin/products[/{id}]`        | Admin                            | Product management                                                                                         |
| PUT                   | `/admin/variants/{id}/stock`    | Admin                            | Set stock per size (optimistic locking via `version`)                                                      |
| GET                   | `/admin/orders`                 | Admin                            | Order queue                                                                                                |
| PATCH                 | `/admin/orders/{id}/status`     | Admin                            | Fulfilment status change                                                                                   |
| GET/POST/PATCH        | `/admin/promo-codes[/{id}]`     | Admin                            | Promotions                                                                                                 |
| PATCH                 | `/admin/reviews/{id}`           | Admin                            | Moderate review                                                                                            |

---

## 7. Project folder structure (target)

```
premium-clothing-brand-website/
├── .github/
│   ├── workflows/            ci.yml, release.yml
│   └── dependabot.yml
├── docs/                     ARCHITECTURE.md, TASK_BOARD.md, API.md, SECURITY.md, DEPLOYMENT.md
├── docker/                   Dockerfile, docker-compose.yml, docker-compose.prod.yml
├── e2e/                      Playwright specs
├── prisma/                   schema.prisma, migrations/, seed.ts
├── public/                   self-hosted images and fonts
├── src/
│   ├── app/                  Next.js routes (pages and layouts)
│   │   ├── (shop)/           shop, product, lookbook, journal, quiz, wishlist, bag
│   │   ├── (account)/        login, register, orders, reset password
│   │   ├── (admin)/          admin dashboard (role guarded)
│   │   └── api/v1/           Route Handlers (thin: parse, call service, respond)
│   ├── components/           presentational UI (ported from current components)
│   ├── features/             client feature hooks (cart, wishlist, quiz, consent)
│   ├── server/
│   │   ├── config/           env schema (Zod), constants
│   │   ├── db/               Prisma client singleton
│   │   ├── http/             middleware: auth, CSRF, rate limit, error mapping
│   │   ├── logging/          pino logger with redaction
│   │   └── modules/
│   │       ├── auth/         domain / application / infrastructure
│   │       ├── catalog/
│   │       ├── cart/
│   │       ├── orders/
│   │       ├── payments/     PaymentProvider interface + adapters
│   │       ├── reviews/
│   │       ├── newsletter/
│   │       └── admin/
│   ├── shared/               Zod schemas and DTO types shared by client and server
│   └── lib/                  pure utilities (money, dates, formatting)
├── tests/
│   ├── unit/                 domain rules: pricing, promo, stock, validation
│   └── integration/          API routes against a real PostgreSQL container
├── .env.example
├── .gitignore
├── .prettierrc.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
├── CHANGELOG.md
└── README.md
```

---

## 8. Quality gates and Definition of Done

| Gate              | Tool                                                    | Threshold                                           |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Type safety       | `tsc --noEmit`, `strict` on                             | 0 errors                                            |
| Lint              | ESLint (typescript-eslint, React, jsx-a11y, Next rules) | 0 errors, 0 warnings                                |
| Format            | Prettier                                                | Check passes                                        |
| Unit tests        | Vitest                                                  | All pass. Domain and service coverage at least 85%. |
| Integration tests | Vitest + PostgreSQL container                           | All pass                                            |
| End-to-end        | Playwright                                              | Browse, add to bag, checkout (stubbed payment)      |
| Accessibility     | axe in E2E                                              | 0 serious or critical violations                    |
| Security          | `npm audit --omit=dev`, secret scan                     | No high or critical findings                        |
| Build             | `next build`                                            | Passes                                              |
| Container         | Docker build and `/health/smoke`                        | Passes                                              |

---

## 9. Open decisions (approval gate)

| ID  | Decision                                                              | Recommendation                                                                                   |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| D1  | Architecture: Option A (Next.js) or Option B (Vite + Fastify)         | **Approved: Option A**                                                                           |
| D2  | Base currency: NGN or USD? Keep multi-currency pricing?               | **Approved: USD base** (as in the current storefront). Multi-currency kept, with server-side FX. |
| D3  | Launch scope: storefront plus customer accounts plus admin dashboard? | **Approved: full scope.** The current visual design is preserved through the port.               |
| D4  | Hosting target (open, decide before Stage 5)                          | Docker on a VPS or a managed container host. Decide before Stage 5.                              |
| D5  | Payment provider (deferred by owner)                                  | Paystack for NGN (cards, transfer, USSD). Adapter interface now, no live keys.                   |
| D6  | Product photography                                                   | Replace Pexels stock images with brand photography before launch. Use placeholders until then.   |
| D7  | Legal pages                                                           | Draft placeholder policies now. The business owner must review them before launch.               |
| D8  | Licence for the repository                                            | Proprietary (all rights reserved) unless you choose otherwise.                                   |

---

## 10. Stage 3 implementation decisions

These decisions were made while building the backend. Where the implementation differs from the target schema in §5, this section is authoritative. Stage 4 builds on these choices.

### 10.1 Data and money

- **Money** is stored as integer minor units (USD cents). The base currency is USD (D2). Multi-currency display is planned through server-side FX rates in the `regions` table.
- **Shipping prices** in the seed are USD-base numbers, so each shipping method is stored as `price × 100` USD minor units. Region-specific pricing in local currency is not yet designed. This is an assumption to confirm before launch.
- **Emails** are lowercased by the application before storage and lookup. The database does not use `citext`. Schemas normalise input with `toLowerCase()`.
- **CHECK constraints** live in the migration `20261010072632_check_constraints`, not in the Prisma schema, because Prisma 7 cannot express them. The migration adds 7 constraints: non-negative product prices, variant stock, promo values and order amounts; positive cart and order-item quantities; and review ratings from 1 to 5.
- **Enums** are uppercase in Prisma (`PENDING_PAYMENT`, `PAID`, …). The API returns them lowercase (`pending_payment`) through the DTO mappers. Clients never see the database spelling.
- **Identifiers:** UUID primary keys. Catalogue variants are exposed by SKU in the API. Internal cart and order rows reference the variant UUID.

### 10.2 Catalogue

- **Pagination** uses opaque cursors that encode an offset (`base64url`), with a default page size of 24 and a maximum of 100. Keyset pagination is deferred until data volume requires it.
- **Filters:** category, audience, style, size, colour, price range (major units), free-text search, and five sort keys.

### 10.3 Bag (cart) and promotions

- **Guest bag:** an opaque, random, httpOnly cookie `vellum_guest`, valid for 30 days. The server stores only its SHA-256 hash.
- **Merge on sign-in:** guest lines move into the customer's cart, capped by live stock and the per-line maximum. A guest promo code and shipping choice carry over when the customer has none.
- **Totals** are computed only on the server. The client sends variant SKUs, sizes, and quantities. Limits: 10 per size line, 30 distinct lines.
- **Promo rules** come from the seed: WELCOME10 (10% off) and FREESHIP (free shipping, minimum $150).
- **CIRCLE15** (15% off over $300 for Circle members) is not seeded. The schema has no membership model, so the code would otherwise reach every shopper. The owner decided on this in Stage 3 review. The seed does not create the code, so the storefront answers "not recognised". Any database seeded earlier has the row deactivated, not deleted, so existing foreign keys stay valid.

### 10.4 Checkout and orders

- **Idempotency:** `POST /api/v1/checkout` requires an `Idempotency-Key` header (8–80 characters: letters, digits, `-`, `_`). The stored key is `sha256("<scope>|<key>")`, where scope is `user:<id>` or `guest:<tokenHash>`. The raw key is never stored. A repeat returns the original order with HTTP 200 and `replayed: true`.
- **Stock:** reserved at order creation inside one transaction, using a conditional `UPDATE … WHERE stock >= quantity` per line. Under concurrency, exactly one of two competing checkouts for the last piece succeeds (covered by an integration test).
- **Pricing at checkout:** recomputed from the database. The client's totals are never trusted.
- **Order number:** `VLM-YYYYMMDD-XXXXXX`. The code is 6 characters from a 32-character alphabet with no `0`, `1`, `I`, or `O`. Since 256 is divisible by 32, there is no modulo bias.
- **Unpaid stock release:** not implemented yet. An order in `PENDING_PAYMENT` keeps its reserved stock until a release job (a scheduled task) is built, so this is a known gap. It is tracked on the task board.
- **Guest order access:** a guest reads an order only with the cookie that placed it. Other callers get a plain 404, so existence is not revealed.

### 10.5 Authentication and sessions

- **Passwords:** argon2id. Login runs a decoy verification when the email is unknown, so response timing does not reveal which accounts exist. Login and sign-up failures return the same message.
- **Session:** the cookie `vellum_session` is httpOnly, `SameSite=Lax`, and valid for 7 days. Its token is 32 random bytes, and only the SHA-256 hash is stored.
- **Rotation:** each sign-in issues a new token. The previous session, if any, is not revoked. Full rotation (revoking other sessions) comes with password reset.
- **Rate limits:** login allows 10 attempts per IP and email pair per 15 minutes. Registration allows 5 per IP per hour. Limits apply only when `TRUST_PROXY=true`. Otherwise all clients share a single bucket.
- **Account enumeration (owner decision: keep 409):** a duplicate sign-up returns 409 with a generic message. The status code still reveals that the email is registered. Revisit before launch if enumeration becomes a concern. The alternative is to return 201 and email the account holder.

### 10.6 Request security and errors

- **CSRF:** double-submit token. The server sets the readable cookie `vellum_csrf` (`SameSite=Strict`, 7 days). Unsafe methods must echo it in the `x-csrf-token` header.
- **Origin checks:** unsafe requests with an `Origin` header other than `APP_URL`, or with a cross-site `Sec-Fetch-Site`, are refused with 403.
- **Errors:** every API error is RFC 9457 `application/problem+json`. Unexpected errors return a generic message and the request ID. Internal details are logged, never returned.
- **Unknown API paths** return a 404 problem through a catch-all route, `src/app/api/[...slug]/route.ts`.
- **Known gap:** a wrong HTTP method on an existing route (for example `POST /api/v1/categories`) still gets Next.js's default 405 response. Fixing it needs method-level middleware, which is planned for Stage 5.

### 10.7 Tests

- **Unit (59 → 101 tests):** pricing and promo rules, password hashing, environment parsing, HTTP core and the route pipeline, schemas, the catalogue service (fake repository), cookies, and client-IP parsing.
- **Integration (47 tests):** run against a dedicated PostgreSQL database named `*_test`. The global setup refuses any database whose name lacks `test`, applies migrations, truncates, and reseeds. Coverage covers catalogue, auth, bag, checkout (idempotency and the concurrency race), orders (ownership), and platform endpoints.
- **Coverage gate:** statements ≥ 85%, functions ≥ 85%, lines ≥ 85%, branches ≥ 80%. Measured over the pure and service modules listed in `vitest.config.ts`.

### 10.8 Not yet built in Stage 3

Password reset, role guards and the admin module, wishlist, reviews with moderation, newsletter (double opt-in), contact, payment adapter and webhook, the unpaid-order stock release job, and the looks, journal and size-guide endpoints. Each is a board item.

# Anvukta Consulting Service — Business, Technology & AI

Production website for Anvukta Consulting Service: a senior-led advisory and transformation
practice. Public marketing site, an Insights section with a working CMS, a contact
pipeline that persists to a database, and a protected admin area.

**Strategy. Reinvention. Delivery.**

---

## Quick start

### Prerequisites

- Node.js **20.11+** (developed on 24.x)
- npm 10+
- A C/C++ toolchain is **not** required — `better-sqlite3` installs a prebuilt binary

### Install, configure, run

```bash
npm install
```

```bash
cp .env.example .env
```

Generate a real session secret and paste it into `.env` as `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the database, generate the client and load seed content:

```bash
npm run setup
```

Start the development server:

```bash
npm run dev
```

The site is at <http://localhost:3000>, the admin at <http://localhost:3000/admin>.

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values from your `.env`.
**Change the password before deploying anywhere.** Re-running the seed never
overwrites an existing account's password.

---

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, server components by default) |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4, CSS-first tokens (`src/styles/globals.css`) |
| Database | SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3` |
| Validation | Zod, at every server boundary |
| Auth | First-party sessions: scrypt password hashing, opaque HttpOnly cookie |
| Content | Markdown authored in the CMS, rendered and sanitised on the server |
| Tests | Vitest (unit + integration against a disposable database) |

```
src/
  app/
    (site)/          Public site — home, proposition, contact, blog index, article
    admin/
      login/         Unauthenticated sign-in
      (protected)/   Everything behind the session guard
    actions/         Server actions (contact, auth, admin mutations)
    feed.xml/        RSS route
    robots.ts        robots.txt
    sitemap.ts       XML sitemap (published posts only)
    opengraph-image.tsx   Site-wide social card, generated at build time
  components/
    art/             Original SVG compositions (used instead of stock photos)
    home/            Homepage sections
    proposition/     Sections on /proposition
    insights/        Article cards, filters, pagination
    admin/           CMS forms and the confirm dialog
    layout/ ui/      Header, footer, shared primitives
  content/home.ts    All home and proposition copy, in one reviewable file
  lib/               db, auth, validation, rate limiting, markdown, SEO, site config
prisma/              Schema, migrations, seed
tests/               Vitest suites
scripts/audit.mjs    Lighthouse runner (median of N runs)
```

### Information architecture

| Route | Contains |
| --- | --- |
| `/` | Hero, how we work (`#how-we-work`), latest Insights, ways to engage (`#ways-to-engage`), discovery-session CTA |
| `/proposition` | Proposition, the constraint, what we hear, outcomes, capabilities (`#capabilities`), sectors, leadership, selected experience |
| `/blog`, `/blog/[slug]` | Insights index and articles |
| `/contact` | Enquiry form |

Primary navigation is Home · Our Proposition · Insights · Contact.

Design tokens, type scale, grid, components and motion rules are documented in
[`DESIGN.md`](./DESIGN.md).

### Why no client-side data fetching

Every public page is server-rendered or statically generated. There is no client
data layer, no fetch-on-mount, and no loading spinner on first paint — indexable
content never depends on JavaScript. The only client components are the header
(mobile navigation), a single shared reveal observer, and the two forms.

---

## Content model

| Model | Purpose |
| --- | --- |
| `User` | Admin accounts. Password stored as a scrypt hash. |
| `Session` | Server-side sessions. Only a SHA-256 hash of the token is stored. |
| `Post` | Insights article. `status` is `draft` or `published`; slugs are unique. |
| `Category` / `Tag` / `PostTag` | Insights taxonomy. |
| `ContactSubmission` | Contact enquiries. `new` → `read` → `contacted` → `closed`. |
| `RateLimit` | Fixed-window counters, so limits survive a restart. |

Only posts with `status = "published"` **and** a `publishedAt` in the past are
publicly readable. Drafts and future-dated posts are excluded from the article
route, the index, search, the sitemap and the RSS feed. This is enforced in
`src/lib/posts.ts` and covered by tests in `tests/data-layer.test.ts`.

---

## Testing

```bash
npm test
```

62 tests covering slug/date/text utilities, contact and post validation, Markdown
sanitisation (script stripping, `javascript:` URLs, external-link hardening),
password hashing, the published/draft boundary, filtering, pagination, related
posts and rate limiting. Integration tests build a throwaway SQLite database from
the committed migrations, so they never touch `dev.db`.

```bash
npm run typecheck
npm run lint
```

---

## Performance audits

With the production server running (`npm run build && npm start`):

```bash
node scripts/audit.mjs http://localhost:3000 3
```

Runs Lighthouse three times per page per form factor and keeps the median, because
a single headless run on a developer machine varies by several points. Reports land
in `lighthouse-reports/`, with a roll-up in `lighthouse-reports/summary.json`.

Requires Chrome. Set `CHROME_PATH` if it is not auto-detected.

---

## Deployment

The app needs a Node.js runtime and a writable path for the SQLite file. It is not
compatible with a read-only or ephemeral filesystem unless you switch the datasource
to PostgreSQL (see below).

1. Set the environment variables from `.env.example` on the host. At minimum:
   `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.
2. Point `DATABASE_URL` at a path on a persistent volume, e.g.
   `file:/data/anvukta.db`.
3. Install and build:

```bash
npm ci && npm run build
```

4. Apply migrations and seed the first admin account:

```bash
npm run db:deploy && npm run db:seed
```

5. Start the server:

```bash
npm start
```

6. Terminate TLS in front of the app. `Strict-Transport-Security` is sent in
   production; the rest of the security headers are set in `next.config.ts`.

### Switching to PostgreSQL

1. `prisma/schema.prisma` — change `provider` to `"postgresql"`.
2. `src/lib/db.ts` — swap `PrismaBetterSqlite3` for `@prisma/adapter-pg`.
3. Set `DATABASE_URL` to a `postgresql://` URL.
4. Delete `prisma/migrations/` and run `npx prisma migrate dev --name init`.

The `contains` filters used by search are case-insensitive on SQLite; on PostgreSQL
add `mode: "insensitive"` in `src/lib/posts.ts` to keep the same behaviour.

---

## Configuration

Everything launch-sensitive is configuration, not content. Placeholders are used
until the values are set — nothing is invented in the page copy.

| Variable | Effect when unset |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Falls back to `http://localhost:3000`. **Must** be set in production — it drives canonicals, the sitemap, OG tags and JSON-LD. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shows the `hello@anvukta.example` placeholder. |
| `NEXT_PUBLIC_CONTACT_PHONE` | Phone links are omitted entirely. |
| `NEXT_PUBLIC_CONTACT_ADDRESS` | Address block is omitted. Pipe-separated lines. |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN` / `_X` | Social links and the `sameAs` structured-data entries are omitted. |

### Email notifications

Contact notifications are **optional and currently not configured.**

When `SMTP_HOST`, `SMTP_PORT` and `CONTACT_NOTIFICATION_TO` are all set, a plain-text
notification is sent on each valid submission and `notifiedAt` is stamped on the row.

When they are not set — the current state — the submission is still validated,
stored and confirmed to the sender. No email is attempted and **the site never
claims one was sent**; the admin enquiry view shows
"Not sent — SMTP is not configured".

To enable it, set these in `.env`:

| Variable | Used in |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT` | `src/lib/mail.ts` |
| `SMTP_USER`, `SMTP_PASSWORD` | `src/lib/mail.ts` (omit for an unauthenticated relay) |
| `SMTP_FROM` | `src/lib/mail.ts` (falls back to `SMTP_USER`) |
| `CONTACT_NOTIFICATION_TO` | `src/lib/mail.ts` — the inbox that receives enquiries |

`nodemailer` is already installed and is imported lazily, so it never reaches the
client bundle.

---

## Security

- Server-side validation on every mutation; client validation is convenience only.
- Passwords hashed with scrypt (N=32768, r=8, p=1) from Node's `crypto`.
- Sessions are opaque random tokens in an `HttpOnly`, `SameSite=Strict`,
  `Secure`-in-production cookie. Only the token's SHA-256 hash is stored, so a
  database read cannot be replayed as a login.
- Sign-in and contact submission are rate limited; sign-in returns an identical
  response for a missing account and a wrong password, and always performs a hash
  comparison so the timing matches.
- Contact spam controls: hidden honeypot field, minimum fill time, per-client
  rate limit. No third-party CAPTCHA, so no external requests and no tracking.
- Raw IP addresses are never stored — only a salted, truncated hash.
- CMS Markdown is sanitised server-side with an allow-list before rendering.
  `javascript:` URLs, event handlers and `<script>` are stripped; external links
  get `rel="noopener noreferrer"`.
- CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`
  and `Permissions-Policy` are set in `next.config.ts`. `/admin/*` also sends
  `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
- Admin routes are guarded in the layout **and** re-checked inside every server
  action, so a mutation cannot be reached by a bare POST.

---

## Content integrity

The site copy is rewritten from the supplied capability deck. Deliberately:

- No invented clients, logos, testimonials, awards, certifications or partnerships.
- Results achieved by leadership in **prior roles** are labelled as such wherever
  they appear, and are never presented as Anvukta Consulting Service company results.
- Anonymised examples stay anonymised.
- Outcomes are described as outcomes the practice is designed to support — never
  as guarantees. That qualification is repeated in the footer of every page.
- The "69+ years combined leadership experience" figure carries its source
  qualification inline.

All homepage copy lives in `src/content/home.ts` so it can be reviewed in one place.

### Seeded Insights articles

`npm run db:seed` creates three articles **as drafts**, drawn only from themes the
source material supports and containing no invented statistics or customer stories:

- Why AI Pilots Stall Before Production
- Closing the Gap Between Transformation Strategy and Execution
- What Effective Programme Recovery Governance Looks Like

Review them in `/admin/blog`, then publish when the content is signed off. Publishing
and unpublishing are one click and immediately update the article route, the Insights
index, the sitemap and the RSS feed.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate the Prisma client, then a production build |
| `npm start` | Serve the production build |
| `npm run setup` | Migrate + generate + seed, in one step |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:deploy` | Apply migrations without prompting (production) |
| `npm run db:seed` | Load categories, seed drafts and the first admin account |
| `npm run db:reset` | Drop and rebuild the local database |
| `npm test` | Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

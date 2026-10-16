# Learnings

A running, project-specific memory log — not a changelog. Add an entry when something would
have saved 5+ minutes of a future session if known going in. Four categories, each entry with
a short key and a confidence note, borrowed from `gstack`'s learnings taxonomy. Keep entries
terse; link to code rather than re-explaining it.

Format: `### [Category] short-key — one-line summary` then 2-4 lines of detail.

---

## Patterns

### [Pattern] server-enforced case state machine + immutable event log
The case lifecycle is enforced server-side in `src/lib/case-state-machine.ts`, with every
transition appended as an immutable `CaseEvent`. Never mutate case status directly from a route
handler — always go through the state machine so invalid transitions are rejected centrally.

### [Pattern] public-projection boundary
`src/lib/public-projection.ts` is the single place that decides what a `Case` (and its
updates/documents/fundraiser) looks like on the public `/c/[caseNumber]` page. When adding a
new field to `Case`, decide explicitly whether it belongs in the public projection — don't let
internal fields leak by accident, and don't assume something is private without checking here.

### [Pattern] secret-gated one-time bootstrap endpoints
When Claude's sandbox can't reach the production database directly (the common case), a
GET endpoint gated by a long random secret env var (`ADMIN_DIRECTORY_SECRET`,
`ADMIN_GRANT_SECRET`) that runs entirely inside Vercel's runtime is the working pattern for
one-off production data operations (bulk import, granting the first admin). See
`src/app/api/admin/directory/bulk-import/route.ts` and `src/app/api/admin/grant-admin/route.ts`.
Always validate the secret with a constant-time-safe comparison in mind and delete/disable the
route once its one-time job is done if it's truly one-time.

### [Pattern] cookie-jar Node scripts for multi-actor E2E testing
For flows involving several logged-in actors (reporter → rescuer → provider → admin), a plain
Node `fetch` script that manually tracks `Set-Cookie` per "actor" and drives the real API
against local Postgres is faster to write and more reliable than mocking. Used repeatedly to
verify the provider portal and the events-route authorization fix.

## Pitfalls

### [Pitfall] Vercel build silently serves stale code on `prisma migrate deploy` failure
`package.json`'s `vercel-build` script runs `prisma migrate deploy && next build`. If the
production Supabase project can't be reached (most commonly: it's **paused** — Supabase's free
tier auto-pauses after ~1 week of inactivity), the build fails in ~9 seconds with
`FATAL: (ENOTFOUND) tenant/user <ref> not found` — a cryptic pooler error, not an obvious
"paused" message — and Vercel keeps serving the last successful deployment with no visible
warning anywhere the end user would see. A pushed fix can look completely dead (not even a
console error) purely because of this, while the application code is already correct. Always
check the Vercel Deployments tab for the specific commit's status before trusting that a fix is
live; don't assume a code bug just because a report persists after a push.

### [Pitfall] Nominatim geocoding is blocked from both the dev sandbox and Vercel's runtime
OpenStreetMap Nominatim rejects requests from both this Claude Code sandbox's egress and
Vercel's serverless cloud IPs. Don't build a feature that depends on live Nominatim calls from
either environment. Current workaround: hardcoded neighborhood-centroid coordinates in
`src/lib/directory-seed-data.ts` — an approximation the founder explicitly accepted, not true
geocoding. If accurate geocoding is ever needed, it'll require a paid geocoding API with a key
usable from Vercel, not free Nominatim.

### [Pitfall] org-based vs user-based Assignment — easy to check only one
A case can be accepted either by an individual rescuer (`Assignment.responderUserId`) or by an
org via `accept-receiving` (`Assignment.organisationId`). Authorization checks that only look
at one of these silently let the other path get stuck (could accept, could never advance
status). Fixed via the shared `isReceivingOrgMember()` helper in `src/lib/case-org-auth.ts` —
any new route that gates on "did someone from an accepting party do this" must check both.

### [Pitfall] `+` in a query string decodes to a space
A phone number identifier like `+919000000020` passed in a URL query string arrives
server-side with the `+` decoded to a literal space (standard query-string semantics, easy to
forget). Any route reading a phone number from `req.nextUrl.searchParams` needs to try both the
raw value and the value with a leading space restored to `+`. See the fix in
`src/app/api/admin/grant-admin/route.ts`.

### [Pitfall] Playwright geolocation mock must use `addInitScript`, not `page.evaluate`
`context.addInitScript()` persists the `navigator.geolocation.getCurrentPosition` override
across `page.reload()` and navigations; `page.evaluate()` does not — it only patches the
currently-loaded page instance. Made this mistake twice in this project before it stuck. Always
use `addInitScript` for any Playwright geolocation (or similar browser-API) mock here.

### [Pitfall] This sandbox cannot reach the live site or most third-party hosts
Outbound HTTPS from this Claude Code sandbox goes through a restrictive proxy that blocks the
production `*.vercel.app` domain itself (DNS resolution fails, confirmed via both `curl` and
`WebFetch`), Nominatim, and most arbitrary third-party hosts. Don't spend time retrying direct
fetches to the live site — go straight to asking the user for a screenshot/log, or use an
attached first-party tool (e.g. the Vercel MCP server, once connected) that reaches it through
its own authenticated channel instead of this sandbox's open internet egress.

### [Pitfall] `tsx` doesn't auto-load `.env` the way `next dev` does
Running a seed or one-off script with `tsx` requires explicitly prefixing the env vars
(`DATABASE_URL=... tsx scripts/seed.ts`) or otherwise loading `.env` yourself — it won't pick
it up automatically the way Next.js's own dev/build commands do.

## Preferences (founder's explicit, stated decisions)

### [Preference] platform never holds funds
Fundraising on a case is redirect-only: a goal amount and an external payment link on the
public case page, never payment processing on-platform. See `fundraisingGoalAmount` /
`fundraisingPaymentLink` on `Case` and `src/app/api/cases/[caseNumber]/fundraiser/route.ts`.

### [Preference] vet reports are public, fully visible
Reversed an earlier private-by-default assumption — this was an explicit, deliberate choice,
not an oversight. Documents uploaded by a provider show up in the public case projection
(`PublicCaseDocument`) by design.

### [Preference] "Vets" as the nav label for the provider-facing section
Covers NGOs, vet hospitals, and clinics under one public-facing nav label and onboarding
category picker, even though internally the category can be NGO or VET.

### [Preference] neighborhood-centroid coordinates are an acceptable stand-in for real geocoding
Given the Nominatim blocking pitfall above, the founder accepted approximate coordinates rather
than blocking the directory feature entirely on solving geocoding.

## Architecture

### [Architecture] stack
Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL (Supabase prod, local Postgres dev)
+ NextAuth (Google + dev-login credentials provider) + Tailwind + Vercel + Supabase Storage.

### [Architecture] verification tiers
`VerificationTier` enum: NONE → REPORTER → VERIFIED → PAYMENT_APPROVED. An org/user needs
`PAYMENT_APPROVED` specifically (not just `VERIFIED`) before the fundraiser feature unlocks —
see the approval-route fix that sets `paymentApprovedAt` only for that tier.

### [Architecture] roles and membership
`UserRoleAssignment` (role per user), `OrganisationMember` (membership in an org), and
`Verification` (pending/approved claims with a `targetTier` and attached documents) are three
separate models — don't conflate "has a role" with "is verified" with "is an org member."

# Raksha Network

**One animal. One case. One coordinated response.**

A live case-management network for animal rescue in Mumbai — not a
directory. Anyone can report an injured community animal; the report
becomes a live, trackable case with a public URL; verified rescuers,
ambulances, NGOs, vets, and fosters accept and update it with mandatory
photo proof; the public follows any case and can fund treatment directly.

This repo implements Phase 1 of the build order in the product brief: the
data model and server-enforced case state machine, the public report
flow, the public case page, AI photo triage, a minimal rescuer flow, and
a minimal Command Center — enough to run an end-to-end pilot case by
hand, in this order:

`Report → AI triage → nearest-help list → rescuer accepts → sequential
proof-gated status updates → public case page shows it all live.`

## What's built

- **Data model** (`prisma/schema.prisma`) — every core table from the
  brief: users/roles/verification tiers, organisations + live capacity,
  cases + immutable case events, AI assessments, assignments,
  escalations, care requests, foster placements, contributions/invoices,
  directory listings, moderation flags.
- **Case state machine** (`src/lib/case-state-machine.ts`, 19 passing
  tests in `tests/`) — the single source of truth for legal transitions.
  Enforces mandatory photo evidence entering `PICKED_UP`, `AT_VET`, and a
  `RELEASED` outcome; blocks skipping/reversing states; blocks leaving
  `CLOSED`; implements the "could not attend" escape hatch (valid closure
  from any active state, but only with a written reason).
- **Duplicate detection, layer 1** (`src/lib/duplicate-detection.ts`) —
  the hard heuristic gate (same species + within 300m + within 90 min),
  wired into the report flow as a confirmation screen. Per the brief,
  this can only *block creation*; merging two live cases is always a
  human action (reporter confirmation or, later, a dispatcher merge).
  Layer 2 (AI photo comparison) is intentionally deferred — see Roadmap.
- **Report flow** (`/report`) — GPS capture, camera-first photo (skippable),
  tap-tile injury + species selection, the duplicate interstitial,
  sign-in placed after investment (with the draft persisted through the
  redirect so nothing is lost), animal naming with suggestions, and a
  confirmation screen showing the AI assessment + nearest-help list.
- **Case page** (`/c/[caseNumber]`) — public timeline, status pill,
  graphic-photo blur with tap-to-reveal, follow/share. Goes through
  `src/lib/public-projection.ts`, the one place allowed to shape a public
  API response — exact GPS and reporter identity never pass through it.
- **AI triage** (`src/lib/ai/triage.ts` + `src/lib/ai/templates.ts`) —
  calls the Anthropic API with the photo + injury type, asks for
  structured JSON, and only ever *selects* a vet-written first-aid
  template (never freestyles medical advice). No API key, a failed call,
  or low model confidence all fail safe to "treat as urgent, get to a
  vet" per the brief. Nearest-help list in `src/lib/nearest-help.ts`.
- **Auth scaffold** (`src/lib/auth.ts`) — NextAuth with Google wired and
  a dev-only phone/name Credentials provider (`ENABLE_DEV_LOGIN`) so the
  rest of the app is testable without live OAuth/OTP secrets. Real Tier 1
  verification (OTP phone + ID document) is **not** wired — see Roadmap.
- **Rescuer flow** (`/rescuer`, `/rescuer/[caseNumber]`) — on-duty toggle,
  distance×severity-sorted open-case queue, accept, then sequential
  proof-gated buttons (Reached → Animal secured 📸 → Handed over 📸)
  matching `ASSIGNED → PICKED_UP → AT_VET`, later steps locked until
  earlier ones complete.
- **Command Center** (`/command-center`, admin-only) — unassigned-case
  board with SLA-at-risk highlighting, verification queue with
  approve/reject, and an open moderation/merge-suggestion list.
- **Live feed, stats, directory** (`/feed`, `/stats`, `/directory`) —
  public, no login. Directory ranks verified rescue-network listings
  above commercial ones (via `organisationId` presence).

## What's stubbed or deferred

Intentionally out of scope for this pass — each is a real next step, not
an oversight:

- **Real Tier 1/2/3 verification**: phone OTP (MSG91/Twilio Verify),
  DigiLocker-style ID verification, and the KYC/compliance document
  review flow are not implemented. `Verification` rows and the Command
  Center queue exist; a human still has to build the intake UI and wire
  a real OTP provider before this can take real signups.
- **Cloud storage**: `src/lib/storage.ts` writes to `public/uploads/` on
  local disk. Swap for S3-compatible storage (Supabase Storage or
  Cloudflare R2) before any real deployment — case photos are fine in a
  public bucket, but verification/compliance documents need a *separate*,
  private, encrypted bucket that this function must never touch.
- **PostGIS**: geo queries use a haversine calculation in application
  code (`src/lib/geo.ts`) against plain `Float` lat/lng columns. Fine at
  pilot scale; move nearest-responder queries into PostGIS once case
  volume makes an in-app scan slow.
- **Duplicate detection layer 2** (AI photo comparison): deferred per the
  brief's own build order, until real photo pairs exist to tune it on.
- **Auto-escalation ladder**: `Escalation` rows exist in the schema, but
  the T+5/T+12/T+20 timers are not automated — v1 per the brief is a
  human dispatcher in the Command Center, which is what's built.
- **Payments**: nothing in §6/§10 is built yet (deliberately — the brief
  says build this last, after 2–3 manually-run pilot cases). The schema
  (`Contribution`, `Invoice`) is ready for it.
- **NGO dashboard, Vet/Hospital view, Foster view, Caretaker lane,
  WhatsApp entry**: not built. `OrgCapacity`, `CareRequest`,
  `CaretakerAnimal`, `FosterPlacement` tables exist and are ready to build
  screens against.
- **Directory seed data**: this repo does **not** ship Raksha's real
  ~89-practice contact list — that's real organisational data and
  belongs in a private import, not committed to source. Drop a real
  export at `prisma/directory-seed.csv` (columns in
  `prisma/directory-seed-template.csv`) and run `npm run db:seed`; until
  then the seed script creates a small, clearly-labelled demo network so
  the report/triage/directory flows have something to point at.
- **Maps**: "Navigate" links out to Google Maps directions; no in-app
  map view or pin-adjust UI yet (`NEXT_PUBLIC_MAPS_PROVIDER` reserved).

## Getting started

```bash
cp .env.example .env       # fill in DATABASE_URL at minimum
npm install
npx prisma migrate dev     # creates tables against your Postgres
npm run db:seed            # demo directory + admin user
npm run dev
```

To exercise the full pilot loop locally with `ENABLE_DEV_LOGIN=true`:

1. Sign in via `/login` with any phone number → you're a Reporter.
2. Submit `/report`.
3. To act as a rescuer: give your dev user the `RESCUER` role and
   `VERIFIED` tier directly in the DB (Prisma Studio: `npx prisma studio`),
   then open `/rescuer`, accept the case, and walk it through
   Reached → Animal secured → Handed over.
4. Give yourself the `ADMIN` role the same way to see `/command-center`.

Run tests: `npm test`. Typecheck: `npm run typecheck`. Build: `npm run build`.

## Non-negotiables checklist (brief §11) — status

- [x] Server-side enforcement of photo-required transitions — never trusts the client (`case-state-machine.ts`, re-validated inside the DB transaction in `case-events.ts`)
- [x] Cases immutable/undeletable; closure requires outcome + (if unattended) a reason
- [x] Exact GPS + reporter identity never in the public API (`public-projection.ts`)
- [x] Graphic photos blurred by default, tap-to-view
- [ ] ID/compliance documents encrypted at rest, admin-only — schema has the fields (`idDocRef`, `Verification.documents`); encryption-at-rest + the admin document viewer are not implemented yet
- [x] Contribute button gated on payment-approved flag, server-side — N/A yet, payments not built (by design — see Roadmap)
- [x] Platform holds no funds anywhere in the code — no payment code exists yet at all
- [x] Every AI medical output carries the triage disclaimer; template-driven first aid only
- [x] AI can block duplicate creation but merging live cases always requires human action
- [ ] All timestamps IST; currency ₹ formatted Indian-style — timeline display uses `Asia/Kolkata`; no currency formatting exists yet (no payments UI)
- [x] English UI at launch, structured for i18n — plain strings for now; no i18n library wired, but nothing is baked into images/logic

## Roadmap (continuing the brief's build order, §10)

Steps 1–7 are the substance of this pass. Next, in order: NGO dashboard
(capacity board + intake + treatment log) → Vet/Hospital view → Foster
view → Caretaker lane → donations (after manual pilot cases) → WhatsApp
entry → real OTP/ID verification → cloud storage → PostGIS.

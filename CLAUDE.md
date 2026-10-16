# CLAUDE.md — Raksha Network

Project memory for Claude Code sessions on this repo. Read this first. Full detail lives in
`docs/ENGINEERING-PRINCIPLES.md` (process/workflow) and `docs/LEARNINGS.md` (project-specific
patterns, pitfalls, preferences, architecture — update this file as you go).

## What this is

Raksha Network: a live animal-rescue case-management platform for Mumbai. Reporters submit
cases → AI triage assesses urgency → rescuers/NGOs/vets accept and work the case through a
server-enforced state machine → public case pages show progress → service providers (NGOs,
vets, clinics) run an end-to-end portal (accept, treat, update the public, raise funds via
redirect-only links, upload vet reports, close the case).

Stack: Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL (Supabase prod, local
Postgres for dev) + NextAuth + Tailwind + Vercel. See `README.md` for setup/deploy steps.

Non-negotiable product constraints (established with the founder, do not silently relax):
- The platform never holds funds. Fundraising is redirect-only — a goal amount and an external
  payment link, never payment processing on-platform.
- Vet reports on a case are public and fully visible on the public case page — this was an
  explicit, reversed decision (the earlier default was private patient data); don't re-add a
  privacy gate on this without the founder asking for it.

## Core engineering principles

These were synthesized from Garry Tan's `gstack` and Jesse Vincent's `superpowers` — two
battle-tested AI-agent engineering methodologies — and adapted for a solo-founder project.
Full source material and more checklists are in `docs/ENGINEERING-PRINCIPLES.md`.

**Verification over claims.** Never say "done," "fixed," or "passes" without having just run
the exact command that proves it, in this turn, and read its full output. A report is a claim
until it's re-executed. "Should work" is not evidence. A linter pass is not proof a build
succeeds. (This project has already been burned by this once — see `docs/LEARNINGS.md`
"Pitfalls" for the silent-failure report-flow bug.)

**Root cause, not symptom.** No fix without finding why it's actually happening first: read
the full error/stack trace, reproduce it reliably, check `git log` for what changed recently,
check whether the same class of bug has recurred before (recurrence = architectural smell, not
bad luck). One guard in the shared function beats a guard copy-pasted into every caller. If
3+ fix attempts fail, stop and question the approach — don't try a 4th patch.

**Gates are never weakened to pass them.** Deleting or skipping a test, widening a timeout,
adding a suppression comment (`// @ts-ignore`, `eslint-disable`), or `git commit --no-verify`
is a decision made explicitly and stated out loud — never a silent shortcut. Watch for this
same pattern in your own diffs before calling something done.

**Scope discipline.** One change at a time. No "while I'm here" refactors bundled into a bug
fix. No speculative abstractions for hypothetical future needs — this is already a standing
rule for this project, keep following it.

**Completeness within scope, not completeness of scope.** When you do implement the thing
asked for, implement the whole thing — error handling for real failure modes, the edge case
the spec implies, a verifying test — rather than the 90% version with a silent gap. That's
different from scope creep: it means no half-finished state for the task actually requested,
not "do more than asked."

**AI recommends, founder decides.** If you (or a second opinion) want to deviate from the
founder's stated direction, present the recommendation and the reasoning and ask — never make
the change and report it afterward. This project has real conflicting-constraint history (the
provider-portal fundraising/data-privacy scope expansion) where this exact move mattered.

**Destructive commands need explicit confirmation**, beyond the general safety rules already in
force: `prisma migrate reset`, any `DROP`/`TRUNCATE` against the Case/CaseEvent/Assignment
tables, `git push --force`, `git reset --hard`, deleting Supabase Storage buckets. Ask first,
every time, even against local dev data if there's any chance it's not throwaway.

## Debugging workflow (use for any "it's not working" report)

1. Reproduce it yourself first if at all possible (Playwright against local dev, a cookie-jar
   test script hitting the API directly — see `docs/LEARNINGS.md` for working examples already
   built for this project).
2. If you can't reproduce it directly (e.g. can't reach the live Vercel URL from this sandbox —
   a known, recurring limitation here), state that plainly and ask for the smallest, highest-
   signal piece of evidence: exact error text, a screenshot of the moment it fails, or — often
   most decisive for this project — the Vercel deployment's build log.
3. Before assuming the application code is wrong, rule out: stale deployment (check the Vercel
   Deployments tab — is the commit you think is live actually the latest *successful* one?),
   and environment/infra issues (Supabase project paused is a real, recurring failure mode for
   this project's free tier — see Learnings).
4. One hypothesis at a time. Don't shotgun multiple speculative fixes in one pass.

## Shipping checklist for this project specifically

Learned the hard way — see `docs/LEARNINGS.md` for the full incident writeup:

- `npm run build` succeeding locally does **not** mean Vercel will build successfully: the
  `vercel-build` script runs `prisma migrate deploy` first, which needs a *live* connection to
  the production Supabase database. A paused Supabase project (free tier auto-pauses after
  ~1 week idle) fails the build with a cryptic pooler error
  (`FATAL: (ENOTFOUND) tenant/user ... not found`), and Vercel then silently keeps serving the
  last successful deployment with no obvious warning to the user.
- After pushing a fix and being told "it's still broken," don't assume the fix is live — check
  the Vercel Deployments tab for the specific commit and confirm it says "Ready," not "Error."
- This sandbox cannot reach the live `*.vercel.app` URL (DNS/network blocked, confirmed
  repeatedly) or arbitrary third-party hosts like Nominatim. Don't retry these; ask the user
  for a screenshot/log instead, or use the Vercel MCP tools (now attached to this session) to
  inspect deployments, env vars, and runtime logs directly.

## Where to look next

- `docs/ENGINEERING-PRINCIPLES.md` — full TDD/debugging/review/ship process, gate-integrity
  checklist, design-review rubric, DX principles.
- `docs/LEARNINGS.md` — running log of this project's own patterns, pitfalls, preferences, and
  architecture decisions. Add to it when something would've saved 5+ minutes if you'd known it
  going in.
- `README.md` — setup, deployment, and "becoming an admin" instructions.

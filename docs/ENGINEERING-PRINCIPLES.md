# Engineering Principles

Synthesized from two AI-agent engineering methodologies studied for this project:
[garrytan/gstack](https://github.com/garrytan/gstack) (Garry Tan's personal agent stack — a
full think→plan→build→review→test→ship→reflect pipeline) and
[obra/superpowers](https://github.com/obra/superpowers) (Jesse Vincent's disciplined-engineering
skill set — TDD, systematic debugging, verification). `CLAUDE.md` has the condensed, always-
loaded version of the rules below; this file is the fuller reference.

Neither tool is installed here — this is the portable ~80% of the value, adapted for a
solo-founder Next.js/Prisma/Supabase project, without the installation or process overhead of
the full multi-agent machinery either project is built for.

## 1. Test-driven development (from superpowers)

The Iron Law: **no production code without a failing test first.**

1. Write one minimal test for the next small piece of behavior.
2. Run it and *watch it fail* — confirm it fails for the right reason (not a typo or import
   error). If you didn't watch it fail, you don't know if it tests the right thing.
3. Write the minimal code to make it pass.
4. Run it — and run the *whole* suite, not just the new test.
5. Refactor only while green.

Never write code before its test exists. If you did it backwards, delete the code — don't keep
it "as reference" and backfill a test around it.

This project doesn't currently have a large automated test suite; apply this pragmatically —
for business-logic changes (state machine transitions, authorization checks, duplicate
detection, fundraiser math) a quick vitest or a cookie-jar API script that asserts the expected
behavior is worth writing before the fix, the same way the duplicate-check and events-route
authorization bugs were caught by writing a reproduction first.

## 2. Systematic debugging (from superpowers + gstack, near-identical — merged here)

Iron Law: **no fixes without root-cause investigation first.** Symptom fixes create
whack-a-mole debugging — a guard added in one caller instead of the shared function, a retry
wrapped around a flaky call instead of understanding why it's flaky.

**Phase 1 — Investigate.** Read the full error and stack trace, not just the first line.
Reproduce it reliably before touching code. Check `git log` / recent diffs for what changed.
Check whether this class of bug has happened before in the same area (recurrence = an
architectural smell, not bad luck — worth a bigger fix, not another patch). In a multi-layer
system (client → API route → Prisma → Postgres), add diagnostic logging at each boundary
rather than guessing which layer is wrong.

**Phase 2 — Pattern analysis.** Find a working example of the same kind of thing elsewhere in
the codebase and diff against it.

**Phase 3 — Hypothesis testing.** One hypothesis at a time. Change one variable. Don't shotgun
multiple speculative fixes in a single pass.

**Phase 4 — Implement.** One fix, with a failing test (or reproduction) written first, that
turns green once the fix lands.

**Phase 5 — Verify.** Re-run the original reproduction and the full suite.

**Stop rule:** 3+ failed fix attempts means the architecture or your mental model is wrong —
stop and question the approach rather than trying fix #4. "Scope lock" once a root-cause
hypothesis forms: restrict edits to the implicated module so the investigation doesn't turn
into an unplanned refactor.

## 3. Verification before completion (from both)

Before any "done / fixed / passes / it works" statement:
1. Name the exact command or action that would prove it.
2. Run it, fresh, in this turn.
3. Read the *full* output — exit code 0 is not evidence by itself ("zero tests ran" must never
   be reported as a pass).
4. State the claim together with the evidence, and say "done, unverified" when you genuinely
   can't verify (e.g. this sandbox can't reach the live Vercel URL) rather than implying you
   checked when you didn't.

A sub-agent's or review pass's "tests pass" claim is not trustworthy on its own — re-verify
before relying on it, the same way a parent process shouldn't trust an unverified child report.

## 4. Gate integrity — don't quietly weaken what guards correctness

A checklist of "reward hacking" patterns to watch for in your own diffs, adapted from
`gstack/review/gate-integrity.md`:

- A test removed or disabled to make a suite go green.
- A mock or a grep presented as if it were a live, production-equivalent check.
- A snapshot/golden file regenerated without the test that owns it being touched or understood.
- A `TODO` / `NotImplementedError` committed and reported as "done."
- A test that can't fail (no real negative case, or asserts something trivially true).
- Spec or acceptance criteria edited after the fact to match what was actually delivered,
  instead of the other way around.
- A suppression (`// @ts-ignore`, `eslint-disable-next-line`, a broad `catch {}`) added instead
  of fixing the underlying type/lint/exception issue.
- A gate bypassed outright (`--no-verify`, `continue-on-error: true`, a skipped CI step).
- A timeout or threshold loosened without a cited measurement justifying it.

The question to ask of any of these: *does this relaxation silence the failure it was added
for, or is there a visible, stated reason it's justified in this diff?* If it's the former,
don't do it silently — say so and ask.

## 5. Scope discipline

One change at a time. No bundled "while I'm here" refactors in a bug-fix diff. No
gold-plating of code paths nobody calls yet — grep for actual usage before "doing it properly."
This is already standing project policy; the above is just where it came from.

Completeness is about the *requested* scope, not an invitation to expand it: when you do build
the thing asked for, build the whole thing (the edge case the spec implies, the error path that
will actually happen, a test proving it) rather than leaving a silent gap for later. Don't
conflate "do the complete version of what was asked" with "also improve adjacent things."

## 6. Code review

When requesting a review (of your own diff, or asking a fresh pair of eyes), give it the diff
and the relevant plan/context — not your entire chat history, which biases it toward agreeing
with you. Sort findings Critical / Important / Minor; Critical blocks shipping.

When *receiving* review feedback: verify it technically before agreeing. No reflexive "You're
absolutely right!" — either confirm-and-fix, or push back with your own reasoning if the
feedback is wrong. Technical correctness beats social comfort.

## 7. Safety guardrails

Ask before, and never silently run:
- `rm -rf` outside of build artifacts you just created yourself, `DROP TABLE` / `TRUNCATE`,
  `prisma migrate reset`, `git push --force`, `git reset --hard`, deleting a Supabase Storage
  bucket or Vercel env var.
- Anything destructive against data that isn't obviously your own scratch output — including
  local dev DB data if there's any chance the founder cares about it.

Never against `main`/production without being told explicitly, even if a model (including you)
recommends it as the "right" fix.

## 8. Design review rubric (for UI changes)

Adapted from `gstack/design-review` — grade a UI change against these weighted categories
(A–F, a High-severity finding drops a full letter, Medium drops half):

Visual Hierarchy (15%) · Typography (15%) · Spacing/Layout (15%) · Color/Contrast (10%) ·
Interaction States (10%) · Responsive behavior (10%) · Content Quality (10%) ·
"AI Slop" avoidance (5%) · Motion (5%) · Performance feel (5%).

Keep a running "looks AI-generated" blacklist specific to this project's look and avoid it:
gradient text, generic purple/blue SaaS gradients, nested cards inside cards, an icon tile
floating above every section heading, marketing-buzzword copy ("seamless," "effortless",
"revolutionize"), an oversized hero H1 on a utility screen, uniform rounded-corner-everything
with no visual hierarchy. Raksha's current direction (dense, mobile-first, utilitarian, status-
color-coded) should read as a real rescue-operations tool, not a landing page.

## 9. Developer/provider-experience principles (for onboarding flows — relevant to /report and /provider)

Eight DX-first principles, generalized from dev-tool UX to any onboarding flow:
zero friction at the very first step; incremental steps rather than one big form; learn by
doing rather than reading docs first; sensible defaults with an easy override, not endless
choices; errors state problem + cause + fix, never a bare code; show the user's own real data
in context as soon as possible; speed is itself a feature; look for a "magical moment" early
(e.g. seeing nearby help appear instantly after a photo is analyzed).

Time-to-first-success benchmarks (borrowed concept, re-targeted): for Raksha, the equivalent
metric is **time from opening /report to a case successfully logged**, and separately,
**time from a provider's first visit to /provider to their first accepted case**. Treat a flow
that takes more than ~2 minutes to a first success as a real product problem worth profiling,
not just a UI nit — this is exactly the category of bug the report-flow silent-failure
incident (`docs/LEARNINGS.md`) fell into.

## 10. Reflection / learnings cadence

At the end of any non-trivial work session, ask: did anything happen here that would have
saved 5+ minutes if I'd known it going in? If yes, add it to `docs/LEARNINGS.md` under the
right category (Pattern / Pitfall / Preference / Architecture decision). Don't log
turn-level trivia — only things worth a future session's time to read.

When a deliberate corner is cut with the founder's explicit sign-off (e.g. "ship the simple
version now, revisit later"), say so in the commit message or PR description with the reason,
so it's traceable later rather than silently forgotten.

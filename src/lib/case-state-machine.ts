import { CaseStatus, CaseOutcomeType } from '@prisma/client';

/**
 * Server-side enforcement of the case state machine (build brief §3).
 * Pure, DB-independent, and the single source of truth for legal
 * transitions — never trust a client-supplied status. Any code path that
 * mutates Case.status MUST go through `applyTransition` first.
 *
 *   REPORTED -> TRIAGED -> ACCEPTED -> ASSIGNED -> PICKED_UP* -> AT_VET*
 *     -> TREATMENT -> RECOVERY -> OUTCOME -> CLOSED
 *   * = photo evidence required to enter this state
 *
 * Escape hatch: from any non-CLOSED state, a case may close directly with
 * outcomeType COULD_NOT_ATTEND, provided a written reason is given. Cases
 * are never deleted — only closed, always with a documented outcome.
 */

const FORWARD_ORDER: CaseStatus[] = [
  CaseStatus.REPORTED,
  CaseStatus.TRIAGED,
  CaseStatus.ACCEPTED,
  CaseStatus.ASSIGNED,
  CaseStatus.PICKED_UP,
  CaseStatus.AT_VET,
  CaseStatus.TREATMENT,
  CaseStatus.RECOVERY,
  CaseStatus.OUTCOME,
  CaseStatus.CLOSED,
];

const PHOTO_REQUIRED_STATES: ReadonlySet<CaseStatus> = new Set([
  CaseStatus.PICKED_UP,
  CaseStatus.AT_VET,
]);

// Outcome types reachable via the normal RECOVERY -> OUTCOME transition.
// COULD_NOT_ATTEND only ever arrives via the direct-to-CLOSED escape hatch.
const NORMAL_OUTCOME_TYPES: ReadonlySet<CaseOutcomeType> = new Set([
  CaseOutcomeType.RELEASED,
  CaseOutcomeType.FOSTERED,
  CaseOutcomeType.ADOPTED,
  CaseOutcomeType.DECEASED,
]);

// Outcome types that additionally require photo evidence (state-diagram
// asterisk on RELEASED*).
const OUTCOME_TYPES_REQUIRING_PHOTO: ReadonlySet<CaseOutcomeType> = new Set([
  CaseOutcomeType.RELEASED,
]);

export interface TransitionInput {
  currentStatus: CaseStatus;
  targetStatus: CaseStatus;
  photoUrl?: string | null;
  outcomeType?: CaseOutcomeType | null;
  outcomeReason?: string | null;
}

export interface TransitionOk {
  ok: true;
}

export interface TransitionError {
  ok: false;
  reason: string;
}

export type TransitionResult = TransitionOk | TransitionError;

function err(reason: string): TransitionError {
  return { ok: false, reason };
}

export function isForwardStep(from: CaseStatus, to: CaseStatus): boolean {
  const fromIdx = FORWARD_ORDER.indexOf(from);
  const toIdx = FORWARD_ORDER.indexOf(to);
  return fromIdx !== -1 && toIdx !== -1 && toIdx === fromIdx + 1;
}

/**
 * Validate a proposed transition. Does not mutate anything — callers apply
 * the write only after this returns { ok: true }.
 */
export function validateTransition(input: TransitionInput): TransitionResult {
  const { currentStatus, targetStatus, photoUrl, outcomeType, outcomeReason } = input;

  if (currentStatus === CaseStatus.CLOSED) {
    return err('Case is closed. Cases are never reopened or deleted.');
  }

  // Escape hatch: "could not attend" closure, from any active state.
  if (targetStatus === CaseStatus.CLOSED && outcomeType === CaseOutcomeType.COULD_NOT_ATTEND) {
    if (!outcomeReason || outcomeReason.trim().length === 0) {
      return err('A written reason is required to close a case as "could not attend".');
    }
    return { ok: true };
  }

  // Normal closure must come from OUTCOME, which must already carry an
  // outcome type (set on the RECOVERY -> OUTCOME transition below).
  if (targetStatus === CaseStatus.CLOSED) {
    if (currentStatus !== CaseStatus.OUTCOME) {
      return err('A case can only close from OUTCOME (with a documented outcome) or via the "could not attend" escape hatch.');
    }
    return { ok: true };
  }

  if (!isForwardStep(currentStatus, targetStatus)) {
    return err(
      `Illegal transition: ${currentStatus} -> ${targetStatus}. States cannot be skipped or reversed.`
    );
  }

  if (PHOTO_REQUIRED_STATES.has(targetStatus) && !photoUrl) {
    return err(`Photo evidence is required to enter ${targetStatus}.`);
  }

  if (targetStatus === CaseStatus.OUTCOME) {
    if (!outcomeType || !NORMAL_OUTCOME_TYPES.has(outcomeType)) {
      return err(
        'Entering OUTCOME requires one of: RELEASED, FOSTERED, ADOPTED, DECEASED.'
      );
    }
    if (OUTCOME_TYPES_REQUIRING_PHOTO.has(outcomeType) && !photoUrl) {
      return err(`Photo evidence is required for outcome ${outcomeType}.`);
    }
  }

  return { ok: true };
}

/** Convenience wrapper that throws — for call sites that treat an illegal
 * transition as a programming/API error rather than a recoverable one. */
export function assertValidTransition(input: TransitionInput): void {
  const result = validateTransition(input);
  if (!result.ok) {
    throw new Error(result.reason);
  }
}

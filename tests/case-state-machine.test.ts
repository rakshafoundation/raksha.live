import { describe, expect, it } from 'vitest';
import { CaseStatus, CaseOutcomeType } from '@prisma/client';
import { validateTransition, isForwardStep } from '@/lib/case-state-machine';

describe('case state machine', () => {
  it('allows each legal forward step in the full happy path', () => {
    const chain: CaseStatus[] = [
      CaseStatus.REPORTED,
      CaseStatus.TRIAGED,
      CaseStatus.ACCEPTED,
      CaseStatus.ASSIGNED,
      CaseStatus.PICKED_UP,
      CaseStatus.AT_VET,
      CaseStatus.TREATMENT,
      CaseStatus.RECOVERY,
      CaseStatus.OUTCOME,
    ];

    for (let i = 0; i < chain.length - 1; i++) {
      const from = chain[i]!;
      const to = chain[i + 1]!;
      const result = validateTransition({
        currentStatus: from,
        targetStatus: to,
        photoUrl: 'https://example.com/photo.jpg',
        outcomeType: to === CaseStatus.OUTCOME ? CaseOutcomeType.RELEASED : undefined,
      });
      expect(result.ok, `${from} -> ${to} should be legal`).toBe(true);
    }
  });

  it('closes from OUTCOME to CLOSED', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.OUTCOME,
      targetStatus: CaseStatus.CLOSED,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects skipping states', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.REPORTED,
      targetStatus: CaseStatus.ASSIGNED,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects reversing states', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.ASSIGNED,
      targetStatus: CaseStatus.ACCEPTED,
    });
    expect(result.ok).toBe(false);
  });

  it('requires a photo to enter PICKED_UP', () => {
    const withoutPhoto = validateTransition({
      currentStatus: CaseStatus.ASSIGNED,
      targetStatus: CaseStatus.PICKED_UP,
    });
    expect(withoutPhoto.ok).toBe(false);

    const withPhoto = validateTransition({
      currentStatus: CaseStatus.ASSIGNED,
      targetStatus: CaseStatus.PICKED_UP,
      photoUrl: 'https://example.com/pickup.jpg',
    });
    expect(withPhoto.ok).toBe(true);
  });

  it('requires a photo to enter AT_VET', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.PICKED_UP,
      targetStatus: CaseStatus.AT_VET,
    });
    expect(result.ok).toBe(false);
  });

  it('requires an outcome type to enter OUTCOME', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.RECOVERY,
      targetStatus: CaseStatus.OUTCOME,
    });
    expect(result.ok).toBe(false);
  });

  it('requires photo evidence for a RELEASED outcome', () => {
    const withoutPhoto = validateTransition({
      currentStatus: CaseStatus.RECOVERY,
      targetStatus: CaseStatus.OUTCOME,
      outcomeType: CaseOutcomeType.RELEASED,
    });
    expect(withoutPhoto.ok).toBe(false);

    const withPhoto = validateTransition({
      currentStatus: CaseStatus.RECOVERY,
      targetStatus: CaseStatus.OUTCOME,
      outcomeType: CaseOutcomeType.RELEASED,
      photoUrl: 'https://example.com/released.jpg',
    });
    expect(withPhoto.ok).toBe(true);
  });

  it('does not require a photo for a DECEASED outcome', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.RECOVERY,
      targetStatus: CaseStatus.OUTCOME,
      outcomeType: CaseOutcomeType.DECEASED,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects COULD_NOT_ATTEND as a normal OUTCOME outcome type', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.RECOVERY,
      targetStatus: CaseStatus.OUTCOME,
      outcomeType: CaseOutcomeType.COULD_NOT_ATTEND,
    });
    expect(result.ok).toBe(false);
  });

  it('allows "could not attend" closure from any active state, with a reason', () => {
    for (const from of [CaseStatus.REPORTED, CaseStatus.TRIAGED, CaseStatus.ASSIGNED, CaseStatus.TREATMENT]) {
      const withoutReason = validateTransition({
        currentStatus: from,
        targetStatus: CaseStatus.CLOSED,
        outcomeType: CaseOutcomeType.COULD_NOT_ATTEND,
      });
      expect(withoutReason.ok, `${from} without reason`).toBe(false);

      const withReason = validateTransition({
        currentStatus: from,
        targetStatus: CaseStatus.CLOSED,
        outcomeType: CaseOutcomeType.COULD_NOT_ATTEND,
        outcomeReason: 'Rescuer unable to locate animal after 3 attempts.',
      });
      expect(withReason.ok, `${from} with reason`).toBe(true);
    }
  });

  it('rejects any transition out of CLOSED — cases are never reopened or deleted', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.CLOSED,
      targetStatus: CaseStatus.REPORTED,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects closing directly from a non-OUTCOME state without the escape hatch', () => {
    const result = validateTransition({
      currentStatus: CaseStatus.TREATMENT,
      targetStatus: CaseStatus.CLOSED,
    });
    expect(result.ok).toBe(false);
  });

  it('isForwardStep is strictly adjacent, not just increasing index', () => {
    expect(isForwardStep(CaseStatus.REPORTED, CaseStatus.TRIAGED)).toBe(true);
    expect(isForwardStep(CaseStatus.REPORTED, CaseStatus.ACCEPTED)).toBe(false);
  });
});

import { CaseOutcomeType, CaseStatus, UserRoleName } from '@prisma/client';
import { db } from './db';
import { validateTransition } from './case-state-machine';

export interface ApplyTransitionParams {
  caseId: string;
  actorId: string;
  actorRole: UserRoleName;
  targetStatus: CaseStatus;
  photoUrl?: string | null;
  outcomeType?: CaseOutcomeType | null;
  outcomeReason?: string | null;
  note?: string | null;
}

/**
 * The only code path allowed to change Case.status. Re-validates against
 * the state machine inside the transaction (never trusts a caller who
 * already checked once) and writes the immutable CaseEvent atomically
 * with the status update.
 */
export async function applyCaseTransition(params: ApplyTransitionParams) {
  return db.$transaction(async (tx) => {
    const kase = await tx.case.findUnique({ where: { id: params.caseId } });
    if (!kase) throw new Error('Case not found');

    const result = validateTransition({
      currentStatus: kase.status,
      targetStatus: params.targetStatus,
      photoUrl: params.photoUrl,
      outcomeType: params.outcomeType,
      outcomeReason: params.outcomeReason,
    });
    if (!result.ok) throw new Error(result.reason);

    const updated = await tx.case.update({
      where: { id: kase.id },
      data: {
        status: params.targetStatus,
        outcomeType: params.outcomeType ?? kase.outcomeType,
        outcomeReason: params.outcomeReason ?? kase.outcomeReason,
        closedAt: params.targetStatus === CaseStatus.CLOSED ? new Date() : kase.closedAt,
      },
    });

    await tx.caseEvent.create({
      data: {
        caseId: kase.id,
        actorId: params.actorId,
        actorRole: params.actorRole,
        fromStatus: kase.status,
        toStatus: params.targetStatus,
        photoUrl: params.photoUrl,
        note: params.note,
      },
    });

    return updated;
  });
}

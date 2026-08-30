import { CaseOutcomeType, CaseStatus } from '@prisma/client';

const STYLES: Record<string, string> = {
  red: 'bg-red-100 text-critical',
  amber: 'bg-amber-100 text-urgent',
  green: 'bg-green-100 text-success',
  blue: 'bg-blue-100 text-info',
  purple: 'bg-purple-100 text-ai',
  gray: 'bg-zinc-100 text-zinc-600',
};

const STATUS_LABEL: Record<CaseStatus, string> = {
  REPORTED: 'Reported',
  TRIAGED: 'Triaged',
  ACCEPTED: 'Accepted',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked up',
  AT_VET: 'At vet',
  TREATMENT: 'Treatment',
  RECOVERY: 'Recovery',
  OUTCOME: 'Outcome recorded',
  CLOSED: 'Closed',
};

const STATUS_COLOR: Record<CaseStatus, keyof typeof STYLES> = {
  REPORTED: 'red',
  TRIAGED: 'red',
  ACCEPTED: 'blue',
  ASSIGNED: 'blue',
  PICKED_UP: 'amber',
  AT_VET: 'amber',
  TREATMENT: 'amber',
  RECOVERY: 'amber',
  OUTCOME: 'green',
  CLOSED: 'green',
};

export function StatusPill({
  status,
  outcomeType,
}: {
  status: CaseStatus;
  outcomeType?: CaseOutcomeType | null;
}) {
  let label = STATUS_LABEL[status];
  let color = STATUS_COLOR[status];

  if (status === 'CLOSED' && outcomeType) {
    const outcomeLabel: Record<CaseOutcomeType, string> = {
      RELEASED: 'Released — recovered',
      FOSTERED: 'In foster care',
      ADOPTED: 'Adopted',
      DECEASED: 'Deceased',
      COULD_NOT_ATTEND: 'Closed — could not attend',
    };
    label = outcomeLabel[outcomeType];
    color = outcomeType === 'DECEASED' || outcomeType === 'COULD_NOT_ATTEND' ? 'gray' : 'green';
  }

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${STYLES[color]}`}>
      {label}
    </span>
  );
}

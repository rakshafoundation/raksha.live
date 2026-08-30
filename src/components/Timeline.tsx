import type { PublicTimelineEvent } from '@/lib/public-projection';

const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Reported',
  TRIAGED: 'AI triage complete',
  ACCEPTED: 'Accepted by rescuer',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked up',
  AT_VET: 'Admitted to vet/hospital',
  TREATMENT: 'Treatment underway',
  RECOVERY: 'In recovery',
  OUTCOME: 'Outcome recorded',
  CLOSED: 'Case closed',
};

function formatIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function Timeline({ events }: { events: PublicTimelineEvent[] }) {
  return (
    <ol className="space-y-3 border-l-2 border-zinc-200 pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-info" />
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>{formatIST(e.createdAt)}</span>
            {e.hasPhoto && <span title="Photo evidence attached">📷</span>}
          </div>
          <div className="font-medium">{STATUS_LABEL[e.toStatus] ?? e.toStatus}</div>
          {e.note && <div className="text-sm text-zinc-600">{e.note}</div>}
        </li>
      ))}
    </ol>
  );
}

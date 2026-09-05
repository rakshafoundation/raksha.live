import {
  FileText,
  Sparkles,
  UserCheck,
  Navigation,
  PackageCheck,
  Stethoscope,
  Pill,
  HeartPulse,
  Flag,
  CheckCircle2,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import type { PublicTimelineEvent } from '@/lib/public-projection';

const STATUS_META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  REPORTED: { label: 'Reported', icon: FileText, tone: 'bg-red-100 text-critical' },
  TRIAGED: { label: 'AI triage complete', icon: Sparkles, tone: 'bg-purple-100 text-ai' },
  ACCEPTED: { label: 'Accepted by rescuer', icon: UserCheck, tone: 'bg-blue-100 text-info' },
  ASSIGNED: { label: 'Rescuer en route', icon: Navigation, tone: 'bg-blue-100 text-info' },
  PICKED_UP: { label: 'Picked up', icon: PackageCheck, tone: 'bg-amber-100 text-urgent' },
  AT_VET: { label: 'Admitted to vet/hospital', icon: Stethoscope, tone: 'bg-amber-100 text-urgent' },
  TREATMENT: { label: 'Treatment underway', icon: Pill, tone: 'bg-amber-100 text-urgent' },
  RECOVERY: { label: 'In recovery', icon: HeartPulse, tone: 'bg-amber-100 text-urgent' },
  OUTCOME: { label: 'Outcome recorded', icon: Flag, tone: 'bg-green-100 text-success' },
  CLOSED: { label: 'Case closed', icon: CheckCircle2, tone: 'bg-green-100 text-success' },
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
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const meta = STATUS_META[e.toStatus] ?? { label: e.toStatus, icon: Flag, tone: 'bg-zinc-100 text-zinc-500' };
        const Icon = meta.icon;
        const isLast = i === events.length - 1;
        return (
          <li key={i} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              {!isLast && <span className="w-px flex-1 bg-zinc-200" />}
            </div>
            <div className={isLast ? 'pb-1' : 'pb-6'}>
              <div className="flex items-center gap-2 pt-1.5 text-xs font-medium text-zinc-400">
                <span>{formatIST(e.createdAt)}</span>
                {e.hasPhoto && (
                  <span className="flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-500">
                    <Camera className="h-3 w-3" /> proof
                  </span>
                )}
              </div>
              <p className="font-semibold text-zinc-900">{meta.label}</p>
              {e.note && <p className="text-sm text-zinc-500">{e.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

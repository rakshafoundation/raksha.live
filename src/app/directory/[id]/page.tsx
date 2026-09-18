import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { CATEGORY_LABELS } from '@/lib/directory-categories';
import { ArrowLeft, BadgeCheck, Clock, Navigation, PhoneCall } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DirectoryProfilePage({ params }: { params: { id: string } }) {
  const listing = await db.directoryListing.findUnique({
    where: { id: params.id },
    include: { organisation: true },
  });

  if (!listing) notFound();

  const verified = Boolean(listing.organisation && listing.organisation.verificationTier !== 'NONE');

  // Cases-accepted count is the only "stat" shown — deliberately no
  // treatment/patient data crosses into this public profile (see build
  // brief: NGO/vet acceptance only, never platform-held case records).
  const casesAccepted = listing.organisationId
    ? await db.case.count({ where: { receivingOrganisationId: listing.organisationId } })
    : 0;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
  const embedUrl = `https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed`;

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <Link href="/directory" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-zinc-500">
        <ArrowLeft className="h-4 w-4" /> Directory
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">{listing.name}</h1>
          {verified && <BadgeCheck className="h-5 w-5 shrink-0 text-info" />}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {CATEGORY_LABELS[listing.category]} · {listing.area}
          {listing.claimedAt && (
            <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">
              Claimed
            </span>
          )}
        </p>
      </header>

      {listing.isOpen24x7 && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-success">
          <Clock className="h-3.5 w-3.5" /> Open 24×7
        </span>
      )}
      {!listing.isOpen24x7 && listing.hours && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-600">
          <Clock className="h-3.5 w-3.5" /> {listing.hours}
        </span>
      )}

      <div className="flex gap-2.5">
        <a
          href={`tel:${listing.phone}`}
          className="btn-primary flex-1 items-center justify-center gap-1.5"
        >
          <PhoneCall className="h-4 w-4" /> Call now
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 items-center justify-center gap-1.5"
        >
          <Navigation className="h-4 w-4" /> Directions
        </a>
      </div>

      {verified && casesAccepted > 0 && (
        <div className="card">
          <p className="text-sm text-zinc-500">Cases accepted via Raksha Network</p>
          <p className="text-2xl font-extrabold text-zinc-900">{casesAccepted}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        <iframe
          title={`Map location of ${listing.name}`}
          src={embedUrl}
          className="h-56 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </main>
  );
}

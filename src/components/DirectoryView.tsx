'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DirectoryCategory } from '@prisma/client';
import { BadgeCheck, List, MapIcon, Navigation, PhoneCall } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/directory-categories';
import { distanceMeters } from '@/lib/geo';
import { DirectoryMap } from '@/components/DirectoryMap';

export interface DirectoryListingItem {
  id: string;
  name: string;
  category: DirectoryCategory;
  area: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: string | null;
  isOpen24x7: boolean;
  claimed: boolean;
  verified: boolean;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 50) * 50}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export function DirectoryView({ listings }: { listings: DirectoryListingItem[] }) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocationDenied(true),
      { timeout: 8000 },
    );
  }, []);

  const sorted = useMemo(() => {
    if (!userLocation) return listings;
    return [...listings].sort(
      (a, b) =>
        distanceMeters(userLocation, a) - distanceMeters(userLocation, b),
    );
  }, [listings, userLocation]);

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-full border border-zinc-200 bg-white p-1">
        <button
          onClick={() => setView('list')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            view === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-500'
          }`}
        >
          <List className="h-3.5 w-3.5" /> List
        </button>
        <button
          onClick={() => setView('map')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            view === 'map' ? 'bg-zinc-900 text-white' : 'text-zinc-500'
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" /> Map
        </button>
        {locationDenied && (
          <span className="ml-1 self-center pr-2 text-[11px] text-zinc-400">Location off — showing all</span>
        )}
      </div>

      {view === 'map' ? (
        <DirectoryMap listings={sorted} userLocation={userLocation} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.length === 0 && (
            <p className="card text-center text-sm text-zinc-400">
              No listings yet — seed the directory from the 89-practice base (see prisma/seed.ts).
            </p>
          )}
          {sorted.map((l) => {
            const distance = userLocation ? distanceMeters(userLocation, l) : null;
            return (
              <div key={l.id} className="card transition active:scale-[0.99]">
                <Link href={`/directory/${l.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-900">
                      {l.name}
                      {l.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" />}
                    </span>
                    {l.isOpen24x7 && (
                      <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-success">
                        OPEN 24×7
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {CATEGORY_LABELS[l.category]} · {l.area}
                    {l.claimed && (
                      <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">
                        Claimed
                      </span>
                    )}
                  </p>
                </Link>
                <div className="mt-2 flex items-center gap-4">
                  <a
                    href={`tel:${l.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-info"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> {l.phone}
                  </a>
                  {distance !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400">
                      <Navigation className="h-3 w-3" /> {formatDistance(distance)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

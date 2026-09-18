'use client';

import { useEffect, useRef, useState } from 'react';
import { DirectoryCategory } from '@prisma/client';
import { CATEGORY_LABELS, CATEGORY_MARKER_COLOR } from '@/lib/directory-categories';

export interface MapListing {
  id: string;
  name: string;
  category: DirectoryCategory;
  area: string;
  latitude: number;
  longitude: number;
  phone: string;
  verified: boolean;
}

const MUMBAI_CENTER = { lat: 19.076, lng: 72.8777 };

// Google Maps' loader script only fires its callback once per page —
// track the promise globally so switching List<->Map repeatedly (which
// remounts this component) doesn't try to inject the <script> tag twice.
let mapsLoaderPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsLoaderPromise) return mapsLoaderPromise;

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const callbackName = '__rakshaGoogleMapsReady';
    (window as any)[callbackName] = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return mapsLoaderPromise;
}

export function DirectoryMap({
  listings,
  userLocation,
}: {
  listings: MapListing[];
  userLocation: { latitude: number; longitude: number } | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!apiKey) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as any).google;
        const center = userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : MUMBAI_CENTER;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center,
          zoom: userLocation ? 13 : 11,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Redraw markers whenever the map is ready or the listing set changes
  // (e.g. a category filter chip was clicked).
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const google = (window as any).google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();

    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapRef.current,
        title: 'Your location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 999,
      });
      markersRef.current.push(userMarker);
    }

    const bounds = new google.maps.LatLngBounds();
    listings.forEach((listing) => {
      const position = { lat: listing.latitude, lng: listing.longitude };
      const marker = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: listing.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: CATEGORY_MARKER_COLOR[listing.category],
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
        infoWindow.setContent(`
          <div style="font-family:inherit;min-width:180px">
            <div style="font-weight:700;font-size:14px;margin-bottom:2px">${escapeHtml(listing.name)}${listing.verified ? ' ✓' : ''}</div>
            <div style="font-size:12px;color:#71717a;margin-bottom:8px">${escapeHtml(CATEGORY_LABELS[listing.category])} · ${escapeHtml(listing.area)}</div>
            <div style="display:flex;gap:8px;font-size:12px;font-weight:600">
              <a href="tel:${escapeHtml(listing.phone)}" style="color:#2563eb">Call</a>
              <a href="${directionsUrl}" target="_blank" rel="noopener" style="color:#2563eb">Directions</a>
              <a href="/directory/${listing.id}" style="color:#2563eb">Profile</a>
            </div>
          </div>
        `);
        infoWindow.open(mapRef.current, marker);
      });
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (userLocation) bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
    if (!bounds.isEmpty() && listings.length > 0) {
      mapRef.current.fitBounds(bounds, 64);
    }
  }, [status, listings, userLocation]);

  if (!apiKey) {
    return (
      <div className="card flex flex-col items-center gap-1 py-10 text-center">
        <p className="font-semibold text-zinc-700">Map view isn't set up yet</p>
        <p className="text-sm text-zinc-500">
          Set <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to
          enable it — see README for setup steps.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card flex flex-col items-center gap-1 py-10 text-center">
        <p className="font-semibold text-zinc-700">Couldn't load Google Maps</p>
        <p className="text-sm text-zinc-500">Check that the API key is valid and Maps JavaScript API is enabled.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="h-[60vh] w-full overflow-hidden rounded-2xl border border-zinc-200" />
      <div className="-mx-4 flex flex-wrap gap-x-4 gap-y-1 overflow-x-auto px-4 text-[11px] text-zinc-500">
        {(Object.keys(CATEGORY_LABELS) as DirectoryCategory[]).map((c) => (
          <span key={c} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_MARKER_COLOR[c] }} />
            {CATEGORY_LABELS[c]}
          </span>
        ))}
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

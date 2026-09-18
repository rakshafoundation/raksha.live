'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

const MUMBAI_CENTER = { lat: 19.076, lng: 72.8777 };

export function LocationPicker({
  value,
  onChange,
}: {
  value: { latitude: number; longitude: number } | null;
  onChange: (loc: { latitude: number; longitude: number }) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !containerRef.current) return;
      const google = (window as any).google;
      const center = value ? { lat: value.latitude, lng: value.longitude } : MUMBAI_CENTER;
      mapRef.current = new google.maps.Map(containerRef.current, {
        center,
        zoom: value ? 15 : 11,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      const placeMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        } else {
          markerRef.current = new google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            draggable: true,
          });
          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current.getPosition();
            onChangeRef.current({ latitude: pos.lat(), longitude: pos.lng() });
          });
        }
      };

      if (value) placeMarker(value.latitude, value.longitude);

      mapRef.current.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        placeMarker(lat, lng);
        onChangeRef.current({ latitude: lat, longitude: lng });
      });

      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={value?.latitude ?? ''}
          onChange={(e) => onChange({ latitude: Number(e.target.value), longitude: value?.longitude ?? 0 })}
          className="input-field"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={value?.longitude ?? ''}
          onChange={(e) => onChange({ latitude: value?.latitude ?? 0, longitude: Number(e.target.value) })}
          className="input-field"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={containerRef} className="h-48 w-full overflow-hidden rounded-2xl border border-zinc-200" />
      <p className="text-xs text-zinc-400">
        {ready ? 'Tap the map to place the pin — drag it to fine-tune.' : 'Loading map…'}
      </p>
    </div>
  );
}

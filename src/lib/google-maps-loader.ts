// Google Maps' loader script only fires its callback once per page — track
// the promise globally so mounting multiple map-using components (or
// remounting one, e.g. switching List<->Map) never injects the <script>
// tag twice.
let mapsLoaderPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
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

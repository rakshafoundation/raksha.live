export function LogoMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5c3.2 1.9 5.8 2.6 8 2.6 0 8.7-3.4 13.9-8 16.4-4.6-2.5-8-7.7-8-16.4 2.2 0 4.8-.7 8-2.6Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9.3" cy="10.2" r="1.15" fill="currentColor" />
      <circle cx="14.7" cy="10.2" r="1.15" fill="currentColor" />
      <circle cx="12" cy="13.1" r="1.35" fill="currentColor" />
      <path
        d="M9.6 15.6c.7.9 1.5 1.3 2.4 1.3s1.7-.4 2.4-1.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

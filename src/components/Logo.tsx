// The Catlas logo: a single-line map pin whose top forms cat ears, with a dot in the middle.
// (Other logo ideas are saved as files in design/logo-options/ if we want to swap it.)
export default function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <path
        d="M32 61 C26 56 13 44 13 28 L15 6.5 L26.5 14 Q32 11.5 37.5 14 L49 6.5 L51 28 C51 44 38 56 32 61 Z"
        fill="none"
        stroke="#3D233C"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="28" r="4.8" fill="#3D233C" />
    </svg>
  );
}

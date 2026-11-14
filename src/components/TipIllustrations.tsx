// Three small custom illustrations for the "First outing with your cat?" tips.
// Drawn in the Catlas style: thin dark plum outlines with soft lilac fills.
// They're decoration, so they're hidden from screen readers (the tip text says it all).

const LINE = "#3D233C"; // dark plum outline
const FILL = "#D1C6E7"; // lilac
const PALE = "#FCF3FF"; // page background color
const DEEP = "#261725"; // eyes and noses

interface Props {
  className?: string;
}

function Frame({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={LINE}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Secure setup: a carrier with a cat looking out of the door. */
export function CarrierArt({ className }: Props) {
  return (
    <Frame className={className}>
      {/* handle and body */}
      <path d="M22 20 V15 Q22 11 26 11 H38 Q42 11 42 15 V20" />
      <rect x="7" y="20" width="50" height="38" rx="8" fill={FILL} />
      {/* door */}
      <rect x="13" y="26" width="38" height="26" rx="4" fill={PALE} />
      {/* the cat inside */}
      <path d="M24.5 38 L25 30 L31 35.5 Z" fill={FILL} />
      <path d="M39.5 38 L39 30 L33 35.5 Z" fill={FILL} />
      <circle cx="32" cy="42" r="8" fill={FILL} />
      <ellipse cx="28.5" cy="41.5" rx="1.1" ry="1.8" fill={DEEP} stroke="none" />
      <ellipse cx="35.5" cy="41.5" rx="1.1" ry="1.8" fill={DEEP} stroke="none" />
      <path d="M30.7 44.5 H33.3 L32 46 Z" fill={DEEP} strokeWidth="1" />
      {/* door bars in front of the cat */}
      <path d="M22 26 V52 M42 26 V52" />
      {/* latch */}
      <circle cx="32" cy="55" r="1.4" fill={LINE} stroke="none" />
    </Frame>
  );
}

/** Watch for stress: flattened ears, wide eyes with big pupils, a bead of sweat. */
export function NervousCatArt({ className }: Props) {
  return (
    <Frame className={className}>
      {/* ears pressed flat against the head */}
      <path d="M19.3 24.3 L2 31 L14.6 33 Z" fill={FILL} />
      <path d="M44.7 24.3 L62 31 L49.4 33 Z" fill={FILL} />
      {/* head */}
      <circle cx="32" cy="37" r="18" fill={FILL} />
      {/* wide eyes with big pupils */}
      <circle cx="25" cy="35" r="6" fill={PALE} strokeWidth="1.8" />
      <circle cx="39" cy="35" r="6" fill={PALE} strokeWidth="1.8" />
      <circle cx="25" cy="35" r="3.8" fill={DEEP} stroke="none" />
      <circle cx="39" cy="35" r="3.8" fill={DEEP} stroke="none" />
      <circle cx="26.4" cy="33.6" r="1.1" fill={PALE} stroke="none" />
      <circle cx="40.4" cy="33.6" r="1.1" fill={PALE} stroke="none" />
      {/* nose and a worried little mouth */}
      <path d="M30.5 42 H33.5 L32 44 Z" fill={DEEP} strokeWidth="1" />
      <path d="M28.5 48 Q30.2 46 32 48 Q33.8 50 35.5 48" />
      {/* a bead of sweat */}
      <path d="M53 9 C53 9 48.5 14.5 48.5 17.5 A4.5 4.5 0 0 0 57.5 17.5 C57.5 14.5 53 9 53 9 Z" fill={PALE} />
    </Frame>
  );
}

/** Start quiet: a sleepy cat with a few Zs. */
export function SleepyCatArt({ className }: Props) {
  return (
    <Frame className={className}>
      {/* ears */}
      <path d="M15 37 L15.5 21 L28 29.5 Z" fill={FILL} />
      <path d="M45 37 L44.5 21 L32 29.5 Z" fill={FILL} />
      {/* head */}
      <circle cx="30" cy="43" r="17" fill={FILL} />
      {/* closed, content eyes */}
      <path d="M21 42 Q24.5 46 28 42" />
      <path d="M32 42 Q35.5 46 39 42" />
      {/* nose and a small smile */}
      <path d="M28.7 47.5 H31.3 L30 49 Z" fill={DEEP} strokeWidth="1" />
      <path d="M30 49 Q28.3 51.5 26 50.5 M30 49 Q31.7 51.5 34 50.5" />
      {/* Zzz */}
      <path d="M47 10 H55 L47 20 H55" />
      <path d="M56 2.5 H61 L56 9 H61" strokeWidth="1.8" />
    </Frame>
  );
}

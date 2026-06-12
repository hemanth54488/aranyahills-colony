/**
 * SVG logo inspired by the Aranya Hills Colony board image.
 * Shows rolling hills, pine trees, a house, and a rising sun.
 * Accepts a `size` prop (default 44 for navbar, pass larger for other uses).
 */
export default function ColonyLogo({ size = 44, className = '' }) {
  const id = `lg${size}`   // unique gradient id per rendered size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aranya Hills Colony logo"
    >
      {/* Background — gold gradient rounded square */}
      <rect width="44" height="44" rx="10" fill={`url(#${id}bg)`} />

      {/* Sky tint */}
      <rect width="44" height="26" rx="0" fill="rgba(255,255,255,0.06)" />

      {/* ── Sun ── */}
      <circle cx="22" cy="20" r="6.5" fill="#fde68a" opacity="0.95" />
      {/* Sun rays */}
      <line x1="22" y1="11.5" x2="22" y2="9.5" stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <line x1="27.6" y1="13.4" x2="29" y2="12"  stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <line x1="30.5" y1="19"   x2="32.5" y2="18.5" stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <line x1="16.4" y1="13.4" x2="15" y2="12"   stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <line x1="13.5" y1="19"   x2="11.5" y2="18.5" stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />

      {/* ── Back hills (darker green) ── */}
      <path
        d="M0 31 C5 21 13 27 20 25 C27 23 36 29 44 31 L44 44 L0 44 Z"
        fill="#166534"
      />

      {/* ── Front hills (brighter green) ── */}
      <path
        d="M0 37 C7 27 15 33 22 31 C29 29 37 34 44 37 L44 44 L0 44 Z"
        fill="#15803d"
      />

      {/* ── Left pine tree 1 (tall) ── */}
      <polygon points="5,32 9,32 7,22"    fill="#0f3d24" />
      <polygon points="4.5,28 9.5,28 7,20" fill="#14532d" />

      {/* ── Left pine tree 2 (shorter) ── */}
      <polygon points="10,33 13.5,33 11.75,26.5" fill="#14532d" />

      {/* ── House silhouette ── */}
      {/* Body */}
      <rect x="18" y="28" width="8" height="7" rx="0.5" fill="white" opacity="0.92" />
      {/* Roof */}
      <polygon points="16 28 30 28 23 21" fill="white" opacity="0.92" />
      {/* Door */}
      <rect x="21" y="31.5" width="3" height="3.5" rx="0.5" fill="#14532d" />
      {/* Left window */}
      <rect x="18.5" y="29" width="2" height="1.8" rx="0.3" fill="#14532d" opacity="0.65" />
      {/* Right window */}
      <rect x="23.5" y="29" width="2" height="1.8" rx="0.3" fill="#14532d" opacity="0.65" />

      {/* ── Right round/deciduous tree ── */}
      <ellipse cx="33.5" cy="28" rx="4" ry="3.5" fill="#14532d" opacity="0.85" />
      <rect x="33" y="30" width="1.5" height="2.5" fill="#0f3d24" />

      {/* ── Right pine tree ── */}
      <polygon points="37,32 41,32 39,25" fill="#14532d" />
      <polygon points="36.5,28 41.5,28 39,22" fill="#0f3d24" />

      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="55%"  stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

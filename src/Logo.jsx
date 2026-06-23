// Pi Lens mark — a glowing cyan→violet ring with a small dark lens inside,
// on a deep-purple panel. Rendered as SVG so it stays crisp at any size.
export default function Logo({ className = 'logo' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pi Lens">
      <defs>
        <linearGradient id="pl-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2660" />
          <stop offset="0.55" stopColor="#1b1232" />
          <stop offset="1" stopColor="#0a0712" />
        </linearGradient>
        <linearGradient id="pl-ring" x1="0.15" y1="1" x2="0.85" y2="0">
          <stop offset="0" stopColor="#00e6ff" />
          <stop offset="0.5" stopColor="#2bb8ff" />
          <stop offset="1" stopColor="#7b6cff" />
        </linearGradient>
        <filter id="pl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="1" y="1" width="98" height="98" rx="26" fill="url(#pl-bg)" />
      {/* soft outer glow */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#pl-ring)" strokeWidth="11" opacity="0.45" filter="url(#pl-glow)" />
      {/* crisp ring */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#pl-ring)" strokeWidth="10.5" strokeLinecap="round" />
      {/* dark lens / pupil */}
      <ellipse cx="43" cy="55" rx="6.2" ry="8.4" transform="rotate(-20 43 55)" fill="#0c1120" opacity="0.92" />
    </svg>
  )
}

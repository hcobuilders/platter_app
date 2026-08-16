export function Logo({ size = 19, stroke = "#FEF9EF" }: { size?: number; stroke?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="platter-logo-grad" x1="37" y1="9" x2="55" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9F1C" />
          <stop offset="1" stopColor="#FE6D73" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={stroke} strokeWidth={4} strokeLinejoin="round">
        <rect x={9} y={17} width={18} height={18} rx={4} />
        <rect x={9} y={37} width={18} height={18} rx={4} />
        <rect x={29} y={37} width={18} height={18} rx={4} />
        <rect x={37} y={9} width={18} height={18} rx={4} fill="url(#platter-logo-grad)" />
      </g>
    </svg>
  );
}

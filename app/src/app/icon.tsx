import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generated at build time from the same brand constants <Logo> uses, so a
// palette change updates the favicon along with the in-app mark instead of
// leaving a stale static .ico behind. Rendered on the shell color rather
// than transparent — the mark's default stroke is a near-white cream,
// which would be near-invisible on a light browser tab background.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.shell,
          borderRadius: 7,
        }}
      >
        <svg viewBox="0 0 64 64" width={32} height={32}>
          <defs>
            <linearGradient id="platter-favicon-grad" x1="37" y1="9" x2="55" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={BRAND.gradStart} />
              <stop offset="1" stopColor={BRAND.gradEnd} />
            </linearGradient>
          </defs>
          <g fill="none" stroke={BRAND.stroke} strokeWidth={4} strokeLinejoin="round">
            <rect x={9} y={17} width={18} height={18} rx={4} />
            <rect x={9} y={37} width={18} height={18} rx={4} />
            <rect x={29} y={37} width={18} height={18} rx={4} />
            <rect x={37} y={9} width={18} height={18} rx={4} fill="url(#platter-favicon-grad)" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}

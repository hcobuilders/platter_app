// Single source of truth for the logo mark's colors — mirrors
// tokens.css (--c-cerulean-900, --c-apricot-strong, --c-coral-500,
// --c-floral). Raw hex, not CSS custom properties, because both consumers
// render outside any page's CSS cascade: the in-app <Logo> is inline SVG
// used before/without full page context, and app/icon.tsx is a Satori
// (next/og) image generated at build time with no access to var(). This
// file is the one place to edit if the brand mark's colors change — Logo
// and the generated favicon both read from it, so they can't drift.
export const BRAND = {
  shell: "#0E1F27", // --c-cerulean-900 / --bg-shell
  stroke: "#FEF9EF", // --c-floral / --text-invert
  gradStart: "#FF9F1C", // --c-apricot-strong
  gradEnd: "#FE6D73", // --c-coral-500
} as const;

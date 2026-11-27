/* The site's mark: the eight-pointed star of the river gates, with the Nile
   running through it under a small sun. One geometry, drawn twice: as a thin
   gold line in the header and as a solid tile for the browser icon. */

/* two squares on a 32-unit grid, outer points r 13.2, inner corners r 10.1 */
export const STAR_PATH =
  "M16 2.8L19.87 6.67L25.33 6.67L25.33 12.13L29.2 16L25.33 19.87L25.33 25.33L19.87 25.33" +
  "L16 29.2L12.13 25.33L6.67 25.33L6.67 19.87L2.8 16L6.67 12.13L6.67 6.67L12.13 6.67Z";

/* two full ripples, centred under the sun */
export const WAVE_PATH = "M9 18.4q1.75-1.7 3.5 0t3.5 0t3.5 0t3.5 0";

export const SUN = { cx: 16, cy: 12.6, r: 1.6 };

export function Emblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path className="emblem-star" d={STAR_PATH} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill="currentColor" />
      <path d={WAVE_PATH} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

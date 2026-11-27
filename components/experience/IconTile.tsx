import { STAR_PATH, SUN, WAVE_PATH } from "@/components/experience/Emblem";

/* The emblem as a solid tile: a gold star on the night sky, with the sun and
   the Nile cut back out of it so they still read at 16px. */
export function IconTile({ size, radius }: { size: number; radius: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(160deg, #1d1546 0%, #07061a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 32 32">
        <path d={STAR_PATH} fill="#f0c874" stroke="#f0c874" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r + 0.5} fill="#07061a" />
        <path d={WAVE_PATH} fill="none" stroke="#07061a" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

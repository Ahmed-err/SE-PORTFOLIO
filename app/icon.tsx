import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(160deg, #2a1a55 0%, #f2893a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: "-0.5px",
          color: "#fff6df",
        }}
      >
        AY
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { IconTile } from "@/components/experience/IconTile";

export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

/* iOS rounds the corners itself, so the tile stays square */
export default function AppleIcon() {
  return new ImageResponse(<IconTile size={180} radius={0} />, { ...size });
}

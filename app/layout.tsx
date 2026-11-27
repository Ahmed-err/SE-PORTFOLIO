import type { Metadata, Viewport } from "next";
import { Aref_Ruqaa, Cormorant_Garamond, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Self-hosted by Next and preloaded. "block" holds text invisible for the
   moment the preloaded file takes to land, instead of painting a fallback and
   swapping it out (the flash). Only weights the CSS actually uses are loaded,
   so the hero fonts aren't queued behind unused files. */
const ruqaa = Aref_Ruqaa({ weight: ["400", "700"], subsets: ["arabic"], variable: "--f-ruqaa", display: "block" });
const cormorant = Cormorant_Garamond({ weight: ["400", "500"], style: ["normal", "italic"], subsets: ["latin"], variable: "--f-cormorant", display: "block" });
const plex = IBM_Plex_Sans_Arabic({ weight: ["300", "400", "500"], subsets: ["arabic", "latin"], variable: "--f-plex", display: "block" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "أحمد يوسف | مهندس برمجيات",
  description: "من ضفاف النيل إلى العالم. مواقع ومتاجر وأنظمة أعمال يبنيها أحمد يوسف، مؤسس سرمدكس.",
  openGraph: {
    title: "أحمد يوسف | Ahmed Yousif",
    description: "From the banks of the Nile to the world. Websites, stores and business systems.",
    locale: "ar",
    alternateLocale: "en",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07061a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${ruqaa.variable} ${cormorant.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}

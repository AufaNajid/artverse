import type { Metadata } from "next";
import { Geist, Geist_Mono, Pixelify_Sans, Silkscreen, JetBrains_Mono } from "next/font/google";
import "./tailwind.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

const exhibit = Silkscreen({ variable: "--font-exhibit", subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const exhibitMono = JetBrains_Mono({ variable: "--font-exhibit-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "ARTVERSE — The world of woxiwaldie", template: "%s · ARTVERSE" },
  description: "A little pixel. A whole new world. Explore woxiwaldie's original pixel art, character illustrations, and interactive 3D dreamscape.",
  authors: [{ name: "woxiwaldie" }],
  openGraph: {
    title: "ARTVERSE — The world of woxiwaldie",
    description: "Original pixel art and painted stories inside a playful cyan 3D world.",
    images: [{ url: "/artworks/art2.jpg", width: 1920, height: 1080 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${pixel.variable} ${exhibit.variable} ${exhibitMono.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

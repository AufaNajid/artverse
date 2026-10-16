import type { Metadata } from "next";
import { Geist, Geist_Mono, Pixelify_Sans, Silkscreen, JetBrains_Mono } from "next/font/google";
import "./tailwind.css";
import "./globals.css";
import { getSiteUrl } from "@/data/site-url";

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
  metadataBase: new URL(getSiteUrl()),
  title: { default: "ARTVERSE — Original art, infinite worlds", template: "%s · ARTVERSE" },
  description: "Original pixel art, painted stories, and a floating 3D exhibition.",
  openGraph: {
    title: "ARTVERSE — Original art, infinite worlds",
    description: "Original pixel art, painted stories, and a floating 3D exhibition.",
    images: [{ url: "/3d/opengraph-image", width: 1200, height: 630 }],
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

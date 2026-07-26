import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// Editorial serif for display headings — adds typographic contrast / premium feel.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });

export const metadata = {
  // Absolute base for OG/Twitter/relative image URLs — without this, Next resolves
  // them against localhost, so shared links show a broken preview in production.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://getshoku.com"),
  title: "Shoku — Order smarter",
  description:
    "Shoku is an AI-powered white-label ordering app for cafes and restaurant chains. Get smart recommendations and know exactly what's in your cup.",
  openGraph: {
    title: "Shoku — Your café. Your brand. Zero commission.",
    description: "An AI-powered, white-label ordering app for cafés — menu, loyalty, AI recommendations and WhatsApp marketing, for a flat fee, not an aggregator cut.",
    images: ["/img/shoku-mockup-board.webp"],
  },
  twitter: { card: "summary_large_image", images: ["/img/shoku-mockup-board.webp"] },
};

export const viewport = {
  themeColor: "#3A6B4D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

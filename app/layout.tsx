import { TERMS } from "@/lib/terms";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { Web3Provider } from "@/components/web3-provider";
import { MotionProvider } from "@/components/motion/primitives";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Font sigillum.html (Instrument Serif / Geist / Geist Mono), dimuat via next/font
// (self-hosted otomatis oleh Next.js, tidak perlu <link> ke Google Fonts).
// Nama variabel diakhiri "-family" supaya tidak bentrok dengan token
// --font-display / --font-body / --font-mono yang didefinisikan Tailwind v4
// lewat @theme di globals.css (yang membaca variabel ini sebagai fallback).
// Instrument Serif hanya punya weight 400 (+ italic untuk penekanan <em>).
// Geist & Geist Mono adalah variable font: tanpa `weight`, seluruh rentang dimuat.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display-family",
});

const body = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-family",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  // Mono hanya untuk label kecil: tidak perlu di-preload (mengurangi kontensi di jalur kritis).
  preload: false,
  variable: "--font-mono-family",
});

export const metadata: Metadata = {
  title: `${TERMS.brand}: ${TERMS.tagline}`,
  description: TERMS.description,
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read once on the server so Wagmi's wallet-connection store can hydrate with the same
  // state on first paint client-side too (avoids a flash of "disconnected" for a wallet
  // that's actually still connected) -- see components/web3-provider.tsx.
  const cookieHeader = (await headers()).get("cookie");

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <MotionProvider>
          <Web3Provider cookies={cookieHeader}>
            {/* Header global (CP3): di dalam Web3Provider karena memuat WalletConnect. */}
            <SiteHeader />
            {children}
          </Web3Provider>
        </MotionProvider>
      </body>
    </html>
  );
}

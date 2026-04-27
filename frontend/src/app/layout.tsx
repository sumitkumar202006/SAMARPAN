import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { AudioProvider } from "@/context/AudioContext";
import { InteractionListener } from "@/components/layout/InteractionListener";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { UpgradeModalProvider } from "@/components/ui/UpgradeModal";
import dynamic from "next/dynamic";

// Lazy-load AuraCursor — only ships to desktop (pointer:fine) devices
// ssr:false ensures this ~6KB component never bloats the SSR/mobile bundle
const AuraCursor = dynamic(
  () => import("@/components/ui/AuraCursor").then(m => ({ default: m.AuraCursor })),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",   // Prevents invisible text during font load
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://samarpan-quiz.vercel.app'),
  title: {
    default: "Samarpan Arena | The Ultimate Multi-Arena Quiz Platform",
    template: "%s | Samarpan Arena",
  },
  description: "Experience the next generation of competitive learning. AI-powered quiz generation, squad battles, and global ranking tournaments — free to start.",
  keywords: ["Quiz", "Multiplayer Quiz", "Tournament", "Education", "Competitive Learning", "Gamification", "AI Quiz Generator", "Live Quiz", "Online Quiz Platform"],
  applicationName: "Samarpan Arena",
  authors: [{ name: "Samarpan Team", url: "https://samarpan-quiz.vercel.app" }],
  creator: "Samarpan Arena",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Samarpan Arena | Host. Compete. Rank Up.",
    description: "AI-powered live quiz platform — create rooms in seconds, battle friends, climb global leaderboards. Free to start.",
    url: "https://samarpan-quiz.vercel.app",
    siteName: "Samarpan Arena",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Samarpan Arena — Multiplayer Quiz Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Samarpan Arena | Host. Compete. Rank Up.",
    description: "AI-powered live quiz platform — create rooms in seconds, battle friends, climb global leaderboards.",
    images: ["/og-image.png"],
    creator: "@samarpan_arena",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-accent/30 selection:text-white`}>
        {/* Skip-to-content: first focusable element — keyboard & screen reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-6 focus:py-3 focus:bg-indigo-500 focus:text-white focus:font-black focus:text-sm focus:rounded-xl focus:shadow-2xl focus:outline-none transition-all"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <AudioProvider>
            <SocketProvider>
              <UpgradeModalProvider>
                <InteractionListener />
                <AuraCursor />
                <LayoutShell>{children}</LayoutShell>
              </UpgradeModalProvider>
            </SocketProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

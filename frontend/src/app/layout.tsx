import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { AudioProvider } from "@/context/AudioContext";
import { InteractionListener } from "@/components/layout/InteractionListener";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { UpgradeModalProvider } from "@/components/ui/UpgradeModal";
import { AuraCursorLoader } from "@/components/ui/AuraCursorLoader";

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
    default: "Qyro — Build. Compete. Dominate.",
    template: "%s | Qyro Arena",
  },
  description: "Qyro is an AI-powered competitive quiz platform. Generate quizzes instantly, battle opponents in real-time, climb global ELO rankings. Build. Compete. Dominate.",
  keywords: ["Qyro", "Quiz", "Multiplayer Quiz", "AI Quiz", "Tournament", "ELO Ranking", "Competitive Learning", "Live Quiz", "Quiz Battle", "Online Quiz Platform"],
  applicationName: "Qyro",
  authors: [{ name: "Qyro Team", url: "https://samarpan-quiz.vercel.app" }],
  creator: "Qyro",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: '/qyro-favicon.png',
    apple: '/qyro-favicon.png',
  },
  openGraph: {
    title: "Qyro — Build. Compete. Dominate.",
    description: "AI-powered competitive quiz arena — forge quizzes in seconds, battle opponents, climb global ELO leaderboards.",
    url: "https://samarpan-quiz.vercel.app",
    siteName: "Qyro",
    images: [
      {
        url: "/qyro-logo.png",
        width: 1200,
        height: 630,
        alt: "Qyro — AI-Powered Competitive Quiz Arena",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qyro — Build. Compete. Dominate.",
    description: "AI-powered quiz battles. Forge. Fight. Dominate the leaderboard.",
    images: ["/qyro-logo.png"],
    creator: "@qyro_arena",
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-6 focus:py-3 focus:bg-red-600 focus:text-white focus:font-black focus:text-sm focus:rounded-xl focus:shadow-2xl focus:outline-none transition-all"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <AudioProvider>
            <SocketProvider>
              <UpgradeModalProvider>
                <InteractionListener />
                <AuraCursorLoader />
                <LayoutShell>{children}</LayoutShell>
              </UpgradeModalProvider>
            </SocketProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

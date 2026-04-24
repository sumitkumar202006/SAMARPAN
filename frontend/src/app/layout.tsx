import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { AudioProvider } from "@/context/AudioContext";
import { InteractionListener } from "@/components/layout/InteractionListener";
import { AuraCursor } from "@/components/ui/AuraCursor";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { UpgradeModalProvider } from "@/components/ui/UpgradeModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Samarpan Arena | The Ultimate Multi-Arena Quiz Platform",
  description: "Experience the next generation of competitive learning. AI-powered rapid generation, high-fidelity squad battles, and global ranking tournaments.",
  keywords: ["Quiz", "Multiplayer", "Tournament", "Education", "Competitive", "Gamification", "AI Quiz"],
  openGraph: {
    title: "Samarpan Arena | Host. Compete. Rank up.",
    description: "Samarpan is a premium AI-powered quiz platform designed for elite students and educators.",
    url: "https://samarpan-quiz.vercel.app",
    siteName: "Samarpan Arena",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Samarpan Arena Preview",
      },
    ],
    locale: "en_US",
    type: "website",
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

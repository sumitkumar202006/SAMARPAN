import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { AudioProvider } from "@/context/AudioContext";
import { InteractionListener } from "@/components/layout/InteractionListener";
import { AuraCursor } from "@/components/ui/AuraCursor";
import { LayoutShell } from "@/components/layout/LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Samarpan Quiz | Host. Compete. Rank up.",
  description: "Samarpan is a premium AI-powered quiz platform designed for students and educators.",
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
              <InteractionListener />
              <AuraCursor />
              <LayoutShell>{children}</LayoutShell>
            </SocketProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

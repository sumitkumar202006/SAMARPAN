import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { AudioProvider } from "@/context/AudioContext";
import { InteractionListener } from "@/components/layout/InteractionListener";
import { AuraCursor } from "@/components/ui/AuraCursor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Samarpan Quiz | Host. Compete. Rank up.",
  description: "Samarpan is a premium AI-powered quiz platform designed for students and educators.",
};

import { DynamicBackground } from "@/components/ui/DynamicBackground";

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
              <DynamicBackground />
              
              {/* Refined Digital Texture Overlay */}
              <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

              <div className="flex min-h-screen relative z-10">
                {/* Sidebar: Desktop only */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <Topbar />
                  <main className="flex-1 pb-16 lg:pb-0">
                    {children}
                  </main>
                  {/* Mobile Navigation bar */}
                  <MobileNav />
                </div>
              </div>

              {/* Global Neon Line under Topbar - Hidden on mobile to avoid overlap */}
              <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 pointer-events-none" />
            </SocketProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

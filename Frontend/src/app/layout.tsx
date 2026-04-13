import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

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
          <SocketProvider>
            <div className="flex min-h-screen">
              {/* Sidebar: Desktop only */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 pb-20 lg:pb-0">
                  {children}
                </main>
                {/* Mobile Navigation bar */}
                <MobileNav />
              </div>
            </div>

            {/* Global Neon Line under Topbar */}
            <div className="fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 pointer-events-none" />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

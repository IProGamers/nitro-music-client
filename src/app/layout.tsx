import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { SettingsProvider } from "@/context/SettingsContext";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nitro Music",
  description: "Premium Music App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white h-screen flex overflow-hidden`}>
        <SettingsProvider>
          <PlayerProvider>
            <Sidebar />
            <main className="flex-1 overflow-y-auto pb-24 relative">
              {children}
            </main>
            <Player />
          </PlayerProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

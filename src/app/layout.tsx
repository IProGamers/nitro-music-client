import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { AudioFXProvider } from "@/context/AudioFXContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MusicDataProvider } from "@/context/MusicDataContext";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import LoginPromptModal from "@/components/LoginPromptModal";

const font = Outfit({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} h-screen flex overflow-hidden`} suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <MusicDataProvider>
                <AudioFXProvider>
                  <PlayerProvider>
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto pb-32 md:pb-28 relative">
                      {children}
                    </main>
                    <Player />
                    <LoginPromptModal />
                  </PlayerProvider>
                </AudioFXProvider>
              </MusicDataProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

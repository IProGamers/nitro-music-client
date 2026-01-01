import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { AudioFXProvider } from "@/context/AudioFXContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MusicDataProvider } from "@/context/MusicDataContext";
import { DeviceProvider } from "@/context/DeviceContext";
import { StatsProvider } from "@/context/StatsContext";
import { DJProvider } from "@/context/DJContext";
import { UsageProvider } from "@/context/UsageContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { FriendsProvider } from "@/context/FriendsContext";
import { RoomProvider } from "@/context/RoomContext";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import LoginPromptModal from "@/components/LoginPromptModal";
import LimitReachedModal from "@/components/LimitReachedModal";
import AccountNotificationModal from "@/components/AccountNotificationModal";
import UsernameGuard from "@/components/UsernameGuard";
import ArihantGuard from "@/components/ArihantGuard";
import MobileHeader from "@/components/MobileHeader";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const font = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nitro",
  description: "Premium Music App",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
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
            <UsageProvider>
              <ThemeProvider>
                <MusicDataProvider>
                  <AudioFXProvider>
                    <PlayerProvider>
                      <StatsProvider>
                        <DJProvider>
                          <DeviceProvider>
                            <OfflineProvider>
                              <FriendsProvider>
                                <RoomProvider>
                                  <Sidebar />
                                  <main className="flex-1 overflow-y-auto pb-32 md:pb-28 relative">
                                    <MobileHeader />
                                    <UsernameGuard>
                                      <ArihantGuard>
                                        {children}
                                      </ArihantGuard>
                                    </UsernameGuard>
                                  </main>
                                  <Player />
                                  <LimitReachedModal />
                                  <LoginPromptModal />
                                  <AccountNotificationModal />
                                  <PWAInstallPrompt />
                                </RoomProvider>
                              </FriendsProvider>
                            </OfflineProvider>
                          </DeviceProvider>
                        </DJProvider>
                      </StatsProvider>
                    </PlayerProvider>
                  </AudioFXProvider>
                </MusicDataProvider>
              </ThemeProvider>
            </UsageProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

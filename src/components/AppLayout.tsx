"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import UsernameGuard from "@/components/UsernameGuard";
import ApprovalGuard from "@/components/ApprovalGuard";
import ArihantGuard from "@/components/ArihantGuard";
import Player from "@/components/Player";
import RoomInviteNotifications from "@/components/RoomInviteNotifications";
import React from "react";

/**
 * AppLayout - The master architect of the Nitro Music UI.
 * Enforces a robust global structure that adapts to device viewports and auth states.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  
  if (userProfile?.arihantMode) {
    return (
      <div className="relative min-h-screen bg-black">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black md:flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar />
      
      <main className="relative flex-1 md:pl-[320px]">
        {/* Mobile Header - Sticky at the top */}
        <MobileHeader />
        
        {/* Main Content Area */}
        <div className="pb-32 pt-16 md:pb-24 md:pt-10">
          <ApprovalGuard>
            <UsernameGuard>
              <ArihantGuard>
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8">
                  {children}
                </div>
              </ArihantGuard>
            </UsernameGuard>
          </ApprovalGuard>
        </div>
      </main>
      
      {/* Premium Visual Overlays — desktop only (on mobile it would cover the bottom nav) */}
      <div className="hidden md:block pointer-events-none fixed bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-[45]" />
      
      {/* Global Persistence Components */}
      <Player />
      <RoomInviteNotifications />
    </div>
  );
}

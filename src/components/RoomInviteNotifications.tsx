"use client"
import { useFriends } from '@/context/FriendsContext';
import { useRouter } from 'next/navigation';
import { Headphones, X } from 'lucide-react';

/**
 * Persistent "X invited you to listen together" banners. Driven by the real-time
 * roomInvites listener, so an invite shows up instantly and STAYS until the user
 * joins or dismisses it (no auto-expiry). Rendered globally from AppLayout.
 */
export default function RoomInviteNotifications() {
    const { roomInvites, dismissRoomInvite } = useFriends();
    const router = useRouter();

    if (!roomInvites || roomInvites.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[120] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
            {roomInvites.map((inv) => (
                <div
                    key={inv.roomId}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-4 fade-in duration-300"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shrink-0">
                            <Headphones size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                {inv.hostName} invited you
                            </p>
                            <p className="text-[11px] text-[var(--foreground-muted)]">Listen together · live</p>
                        </div>
                        <button
                            onClick={() => dismissRoomInvite(inv.roomId)}
                            aria-label="Dismiss"
                            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => dismissRoomInvite(inv.roomId)}
                            className="flex-1 py-2 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--foreground)]"
                        >
                            Ignore
                        </button>
                        <button
                            onClick={() => { dismissRoomInvite(inv.roomId); router.push(`/join/${inv.roomId}`); }}
                            className="flex-1 py-2 rounded-full bg-[var(--accent)] text-[#04161a] text-xs font-bold hover:scale-[1.02] active:scale-95 transition-transform"
                        >
                            Join
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

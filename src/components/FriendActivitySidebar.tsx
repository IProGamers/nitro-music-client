"use client"
import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth, UserStatus } from '@/context/AuthContext';
import { Music, Users, Headphones, ExternalLink, X, UserPlus } from 'lucide-react';
import Link from 'next/link';
import FriendSearch from './FriendSearch';

const statusColors: Record<UserStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    invisible: 'bg-gray-500'
};

interface FriendActivity {
    oderId: string;
    friendName: string;
    friendPhoto: string | null;
    friendStatus: UserStatus;
    nowPlaying: {
        songId: string;
        songName: string;
        artistName: string;
        image: string;
        startedAt: Date;
    } | null;
}

export default function FriendActivitySidebar() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<FriendActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true);
    const [showAddFriends, setShowAddFriends] = useState(false);

    useEffect(() => {
        if (!user) {
            setFriends([]);
            setLoading(false);
            return;
        }

        const fetchFriendsActivity = async () => {
            try {
                // Get users I'm following
                const followingRef = collection(db, 'users', user.uid, 'following');
                const followingSnap = await getDocs(followingRef);

                if (followingSnap.empty) {
                    setFriends([]);
                    setLoading(false);
                    return;
                }

                const friendIds = followingSnap.docs.map(doc => doc.id);

                // For each friend, set up a real-time listener for their nowPlaying
                const unsubscribes: (() => void)[] = [];
                const friendsData: { [key: string]: FriendActivity } = {};

                for (const friendId of friendIds) {
                    const friendRef = doc(db, 'users', friendId);

                    const unsubscribe = onSnapshot(friendRef, (snap) => {
                        if (snap.exists()) {
                            const data = snap.data();
                            friendsData[friendId] = {
                                oderId: friendId,
                                friendName: data.displayName || 'User',
                                friendPhoto: data.photoURL || null,
                                friendStatus: data.status || 'online',
                                nowPlaying: data.nowPlaying || null
                            };

                            // Update state with all friends
                            setFriends(Object.values(friendsData).filter(f => f.nowPlaying));
                        }
                    });

                    unsubscribes.push(unsubscribe);
                }

                setLoading(false);

                return () => {
                    unsubscribes.forEach(unsub => unsub());
                };
            } catch (err) {
                console.error('Error fetching friend activity:', err);
                setLoading(false);
            }
        };

        fetchFriendsActivity();
    }, [user]);

    // Only show on large screens (xl+)
    // Use CSS class instead of JS check for better SSR compatibility
    if (!user) return null;

    return (
        <div className={`hidden xl:block fixed right-0 top-0 h-full w-80 bg-[var(--card)]/50 backdrop-blur-xl border-l border-[var(--border)] z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
            {/* Toggle Button - positioned near top, always clickable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-12 top-20 w-12 h-12 bg-[var(--card)] border border-[var(--border)] rounded-l-xl flex items-center justify-center text-[var(--foreground-muted)] hover:text-cyan-400 hover:bg-[var(--card-hover)] transition-all shadow-lg pointer-events-auto z-50"
                title={isOpen ? "Hide Friend Activity" : "Show Friend Activity"}
            >
                <Users size={18} />
            </button>

            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Users size={16} className="text-cyan-400" />
                        Friend Activity
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAddFriends(true)}
                            className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-[var(--foreground-muted)] hover:text-cyan-400 transition-colors"
                            title="Add Friends"
                        >
                            <UserPlus size={14} />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--foreground-muted)] transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100%-56px)] p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--foreground-muted)]">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-xs">Loading...</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-12">
                        <Headphones size={32} className="text-[var(--foreground-muted)]/30 mx-auto mb-3" />
                        <p className="text-sm text-[var(--foreground-muted)] mb-1">No friends listening</p>
                        <p className="text-[10px] text-[var(--foreground-muted)]/60">
                            Follow more users to see what they're playing
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {friends.map(friend => (
                            <Link
                                key={friend.oderId}
                                href={`/user/${friend.oderId}`}
                                className="block p-3 rounded-xl bg-[var(--background)]/50 hover:bg-[var(--card-hover)] border border-transparent hover:border-cyan-400/20 transition-all group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Friend Avatar */}
                                    <div className="relative shrink-0">
                                        {friend.friendPhoto ? (
                                            <img src={friend.friendPhoto} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {friend.friendName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        {/* Listening indicator */}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--card)] flex items-center justify-center">
                                            <Music size={8} className="text-white" />
                                        </div>
                                    </div>

                                    {/* Friend Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">
                                            {friend.friendName}
                                        </p>

                                        {friend.nowPlaying && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <img
                                                    src={friend.nowPlaying.image}
                                                    className="w-8 h-8 rounded"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">
                                                        {friend.nowPlaying.songName}
                                                    </p>
                                                    <p className="text-[9px] text-[var(--foreground-muted)] truncate">
                                                        {friend.nowPlaying.artistName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <ExternalLink size={12} className="text-[var(--foreground-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Friends Modal */}
            {showAddFriends && (
                <div className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur-xl z-50 p-4 overflow-y-auto">
                    <FriendSearch onClose={() => setShowAddFriends(false)} />
                </div>
            )}
        </div>
    );
}

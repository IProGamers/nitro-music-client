"use client"
import { useState } from 'react';
import { useAuth, UserStatus } from '@/context/AuthContext';
import { Search, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchResult {
    uid: string;
    displayName: string;
    username: string | null;
    photoURL: string | null;
    status: UserStatus;
}

const statusColors: Record<UserStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    invisible: 'bg-gray-500'
};

const statusLabels: Record<UserStatus, string> = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    invisible: 'Invisible'
};

export default function FriendSearch({ onClose }: { onClose?: () => void }) {
    const { user, searchUsersByName } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingStates, setFollowingStates] = useState<Record<string, 'none' | 'loading' | 'following'>>({});

    const handleSearch = async () => {
        if (!query.trim() || query.length < 2) return;

        setLoading(true);
        try {
            const users = await searchUsersByName(query);
            setResults(users);

            // Check follow status for each user
            if (user) {
                const states: Record<string, 'none' | 'loading' | 'following'> = {};
                for (const u of users) {
                    const followRef = doc(db, 'users', user.uid, 'following', u.uid);
                    const followSnap = await getDoc(followRef);
                    states[u.uid] = followSnap.exists() ? 'following' : 'none';
                }
                setFollowingStates(states);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUid: string, targetName: string) => {
        if (!user) return;

        setFollowingStates(prev => ({ ...prev, [targetUid]: 'loading' }));

        try {
            // Add to my following list
            const followingRef = doc(db, 'users', user.uid, 'following', targetUid);
            await setDoc(followingRef, {
                followedAt: new Date(),
                displayName: targetName
            });

            // Add to their followers list
            const followersRef = doc(db, 'users', targetUid, 'followers', user.uid);
            await setDoc(followersRef, {
                followedAt: new Date()
            });

            setFollowingStates(prev => ({ ...prev, [targetUid]: 'following' }));
        } catch (err) {
            console.error('Failed to follow:', err);
            setFollowingStates(prev => ({ ...prev, [targetUid]: 'none' }));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                    <UserPlus size={18} className="text-cyan-400" />
                    Add Friends
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--foreground-muted)]">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by username..."
                    className="w-full pl-10 pr-20 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading || query.length < 2}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                </button>
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.length === 0 && query.length >= 2 && !loading && (
                    <p className="text-center text-sm text-[var(--foreground-muted)] py-4">
                        No users found matching "{query}"
                    </p>
                )}

                {results.map((u) => (
                    <div
                        key={u.uid}
                        className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]"
                    >
                        {/* Avatar with status */}
                        <div className="relative shrink-0">
                            {u.photoURL ? (
                                <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {u.displayName[0]?.toUpperCase()}
                                </div>
                            )}
                            {/* Status indicator */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColors[u.status]} rounded-full border-2 border-[var(--background)]`}
                                title={statusLabels[u.status]}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[var(--foreground)] truncate">
                                {u.displayName}
                            </p>
                            {u.username && (
                                <p className="text-[10px] text-cyan-400 font-medium">
                                    @{u.username}
                                </p>
                            )}
                            <p className="text-[9px] text-[var(--foreground-muted)]">
                                {statusLabels[u.status]}
                            </p>
                        </div>

                        {/* Follow Button */}
                        <button
                            onClick={() => handleFollow(u.uid, u.displayName)}
                            disabled={followingStates[u.uid] === 'loading' || followingStates[u.uid] === 'following'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${followingStates[u.uid] === 'following'
                                ? 'bg-green-500/20 text-green-400 cursor-default'
                                : followingStates[u.uid] === 'loading'
                                    ? 'bg-[var(--card)] text-[var(--foreground-muted)]'
                                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                }`}
                        >
                            {followingStates[u.uid] === 'following' ? (
                                <span className="flex items-center gap-1"><Check size={12} /> Following</span>
                            ) : followingStates[u.uid] === 'loading' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <span className="flex items-center gap-1"><UserPlus size={12} /> Follow</span>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Hint */}
            <p className="text-[10px] text-[var(--foreground-muted)] text-center mt-4">
                Search for friends by their display name to follow them
            </p>
        </div>
    );
}

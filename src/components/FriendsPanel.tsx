"use client"
import { useState } from 'react';
import { useFriends, Friend, FriendRequest } from '@/context/FriendsContext';
import { useRoom } from '@/context/RoomContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, UserMinus, Check, X, Search,
    Music, Radio, Loader2, Clock,
    Send, ChevronRight, Headphones, Sparkles, Lock
} from 'lucide-react';
import Link from 'next/link';

interface FriendsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'friends' | 'requests' | 'find';

const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    invisible: 'bg-gray-500'
};

export default function FriendsPanel({ isOpen, onClose }: FriendsPanelProps) {
    const { user, userProfile, searchUsersByName } = useAuth();
    const {
        friends,
        loadingFriends,
        pendingRequests,
        sentRequests,
        loadingRequests,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        removeFriend,
        getFriendStatus,
        canUseListenTogether,
        getOnlineFriends
    } = useFriends();

    // Get activeRoom from RoomContext (Socket.io)
    const { activeRoom, isInRoom, inviteToRoom } = useRoom();

    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return;
        setSearching(true);
        try {
            const results = await searchUsersByName(searchQuery);
            setSearchResults(results);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (userId: string, userName: string) => {
        setActionLoading(userId);
        try {
            await sendFriendRequest(userId, userName);
        } catch (err) {
            console.error('Failed to send request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
        setActionLoading(requestId);
        try {
            await acceptFriendRequest(requestId, fromUserId);
        } catch (err) {
            console.error('Failed to accept request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await declineFriendRequest(requestId);
        } catch (err) {
            console.error('Failed to decline request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Cancelling a SENT request must use cancelFriendRequest (updates sentRequests);
    // declineFriendRequest only updates the incoming pendingRequests list, so the
    // cancelled item would linger in the UI.
    const handleCancelRequest = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await cancelFriendRequest(requestId);
        } catch (err) {
            console.error('Failed to cancel request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!confirm('Remove this friend?')) return;
        setActionLoading(friendId);
        try {
            await removeFriend(friendId);
        } catch (err) {
            console.error('Failed to remove friend:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Real in-app invite: drops a persistent invite the friend sees live and joins
    // from (falls back to copying the link if the invite write fails).
    const handleInviteToRoom = async (friendId: string) => {
        if (!activeRoom) return;
        setActionLoading(`invite_${friendId}`);
        try {
            await inviteToRoom(friendId);
            setInviteSuccess(friendId);
            setTimeout(() => setInviteSuccess(null), 2000);
        } catch (err) {
            console.error('Invite failed, copying link instead:', err);
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                await navigator.clipboard.writeText(`${baseUrl}/join/${activeRoom.id}`);
                setInviteSuccess(friendId);
                setTimeout(() => setInviteSuccess(null), 2000);
            } catch { /* noop */ }
        } finally {
            setActionLoading(null);
        }
    };

    const onlineFriends = getOnlineFriends();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-end md:items-center justify-center md:p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ y: 48, scale: 0.97, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 48, scale: 0.97, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="bg-[var(--card)] rounded-t-3xl md:rounded-3xl border border-[var(--border)] w-full max-w-xl h-[85vh] md:h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                    >
                {/* Header */}
                <div className="p-5 border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-[var(--foreground)]">Friends</h2>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {friends.length} friends • {onlineFriends.length} online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--card-hover)] rounded-xl transition-colors"
                        >
                            <X size={20} className="text-[var(--foreground-muted)]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-[var(--background)] rounded-xl p-1">
                        {[
                            { id: 'friends', label: 'Friends', count: friends.length },
                            { id: 'requests', label: 'Requests', count: pendingRequests.length },
                            { id: 'find', label: 'Find Friends', count: null }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id
                                    ? 'bg-cyan-500 text-white'
                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== null && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id
                                        ? 'bg-white/20'
                                        : 'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <AnimatePresence mode="wait">
                        {/* Friends Tab */}
                        {activeTab === 'friends' && (
                            <motion.div
                                key="friends"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                {loadingFriends ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-cyan-400" size={24} />
                                    </div>
                                ) : friends.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users size={48} className="text-[var(--foreground-muted)]/30 mx-auto mb-3" />
                                        <p className="text-sm text-[var(--foreground-muted)] mb-2">No friends yet</p>
                                        <button
                                            onClick={() => setActiveTab('find')}
                                            className="text-xs text-cyan-400 hover:underline"
                                        >
                                            Find friends to add
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Online Friends Section */}
                                        {onlineFriends.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    Online — {onlineFriends.length}
                                                </p>
                                                {onlineFriends.map(friend => (
                                                    <FriendCard
                                                        key={friend.id}
                                                        friend={friend}
                                                        onRemove={() => handleRemoveFriend(friend.id)}
                                                        onInvite={activeRoom ? () => handleInviteToRoom(friend.id) : undefined}
                                                        isLoading={actionLoading === friend.id || actionLoading === `invite_${friend.id}`}
                                                        inviteSuccess={inviteSuccess === friend.id}
                                                        canInvite={canUseListenTogether}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Offline Friends */}
                                        {friends.filter(f => !f.isOnline || f.status === 'invisible').length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                                    Offline — {friends.filter(f => !f.isOnline || f.status === 'invisible').length}
                                                </p>
                                                {friends
                                                    .filter(f => !f.isOnline || f.status === 'invisible')
                                                    .map(friend => (
                                                        <FriendCard
                                                            key={friend.id}
                                                            friend={friend}
                                                            onRemove={() => handleRemoveFriend(friend.id)}
                                                            isLoading={actionLoading === friend.id}
                                                            canInvite={false}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Requests Tab */}
                        {activeTab === 'requests' && (
                            <motion.div
                                key="requests"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* Pending Requests */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                        Incoming Requests — {pendingRequests.length}
                                    </p>
                                    {loadingRequests ? (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="animate-spin text-cyan-400" size={20} />
                                        </div>
                                    ) : pendingRequests.length === 0 ? (
                                        <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                                            No pending requests
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {pendingRequests.map(request => (
                                                <RequestCard
                                                    key={request.id}
                                                    request={request}
                                                    type="incoming"
                                                    onAccept={() => handleAcceptRequest(request.id, request.fromUserId)}
                                                    onDecline={() => handleDeclineRequest(request.id)}
                                                    isLoading={actionLoading === request.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sent Requests */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                        Sent Requests — {sentRequests.length}
                                    </p>
                                    {sentRequests.length === 0 ? (
                                        <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                                            No pending sent requests
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {sentRequests.map(request => (
                                                <RequestCard
                                                    key={request.id}
                                                    request={request}
                                                    type="sent"
                                                    onCancel={() => handleCancelRequest(request.id)}
                                                    isLoading={actionLoading === request.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Find Friends Tab */}
                        {activeTab === 'find' && (
                            <motion.div
                                key="find"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {/* Search Input */}
                                <div className="relative mb-4">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by username or display name..."
                                        className="w-full pl-10 pr-20 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={searching || searchQuery.length < 2}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        {searching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                {/* Results */}
                                <div className="space-y-2">
                                    {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                                        <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                                            No users found matching "{searchQuery}"
                                        </p>
                                    )}

                                    {searchResults.map((u) => {
                                        const friendStatus = getFriendStatus(u.uid);
                                        return (
                                            <div
                                                key={u.uid}
                                                className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]"
                                            >
                                                <div className="relative shrink-0">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {u.displayName[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColors[u.status as keyof typeof statusColors] || 'bg-gray-500'} rounded-full border-2 border-[var(--background)]`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-[var(--foreground)] truncate">
                                                        {u.displayName}
                                                    </p>
                                                    {u.username && (
                                                        <p className="text-[10px] text-cyan-400 font-medium">
                                                            @{u.username}
                                                        </p>
                                                    )}
                                                </div>

                                                {friendStatus === 'friends' ? (
                                                    <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1">
                                                        <Check size={12} /> Friends
                                                    </span>
                                                ) : friendStatus === 'pending_sent' ? (
                                                    <span className="px-3 py-1.5 bg-[var(--card)] text-[var(--foreground-muted)] text-xs font-bold rounded-lg flex items-center gap-1">
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                ) : friendStatus === 'pending_received' ? (
                                                    <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg">
                                                        Accept?
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSendRequest(u.uid, u.displayName)}
                                                        disabled={actionLoading === u.uid}
                                                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === u.uid ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus size={12} /> Add
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Friend Card Component
function FriendCard({
    friend,
    onRemove,
    onInvite,
    isLoading,
    inviteSuccess,
    canInvite
}: {
    friend: Friend;
    onRemove: () => void;
    onInvite?: () => void;
    isLoading: boolean;
    inviteSuccess?: boolean;
    canInvite: boolean;
}) {
    return (
        <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)] mb-2 hover:border-cyan-500/20 transition-colors">
            {/* Avatar */}
            <Link href={`/user/${friend.id}`} className="relative shrink-0">
                {friend.photoURL ? (
                    <img src={friend.photoURL} className="w-11 h-11 rounded-full object-cover" alt="" />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {friend.displayName[0]?.toUpperCase()}
                    </div>
                )}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColors[friend.status]} rounded-full border-2 border-[var(--background)]`} />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <Link
                        href={`/user/${friend.id}`}
                        className="font-medium text-sm text-[var(--foreground)] truncate hover:text-cyan-400 transition-colors"
                    >
                        {friend.displayName}
                    </Link>
                </div>
                {friend.username && (
                    <p className="text-[10px] text-cyan-400">@{friend.username}</p>
                )}
                {friend.nowPlaying && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <Music size={10} className="text-green-400" />
                        <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                            {friend.nowPlaying.songName}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
                {onInvite && canInvite && (
                    <button
                        onClick={onInvite}
                        disabled={isLoading}
                        className={`p-2 rounded-lg transition-all ${inviteSuccess
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                            }`}
                        title="Invite to Listen Together"
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : inviteSuccess ? (
                            <Check size={14} />
                        ) : (
                            <Headphones size={14} />
                        )}
                    </button>
                )}
                <button
                    onClick={onRemove}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-[var(--card)] hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-400 transition-all"
                    title="Remove friend"
                >
                    {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <UserMinus size={14} />
                    )}
                </button>
            </div>
        </div>
    );
}

// Request Card Component
function RequestCard({
    request,
    type,
    onAccept,
    onDecline,
    onCancel,
    isLoading
}: {
    request: FriendRequest;
    type: 'incoming' | 'sent';
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            {/* Avatar */}
            <div className="relative shrink-0">
                {request.fromUserPhoto ? (
                    <img src={request.fromUserPhoto} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {request.fromUserName[0]?.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--foreground)] truncate">
                    {request.fromUserName}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)]">
                    {type === 'incoming' ? 'Wants to be your friend' : 'Request pending'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
                {type === 'incoming' ? (
                    <>
                        <button
                            onClick={onAccept}
                            disabled={isLoading}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                            onClick={onDecline}
                            disabled={isLoading}
                            className="p-2 bg-[var(--card)] hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X size={14} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-[var(--card)] hover:bg-red-500/10 text-[var(--foreground-muted)] hover:text-red-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
                    </button>
                )}
            </div>
        </div>
    );
}

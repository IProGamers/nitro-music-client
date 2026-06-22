"use client"
import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/context/FriendsContext';
import { useRoom } from '@/context/RoomContext';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Users, Music, Crown, Play, Pause, SkipForward,
    Copy, Check, UserPlus, Headphones, Radio, Sparkles,
    Loader2, Volume2, Link as LinkIcon, ChevronRight, Zap, Lock, Share2, ExternalLink,
    UserMinus, Ban, ArrowRightLeft, MoreVertical, Wifi, WifiOff
} from 'lucide-react';
import Link from 'next/link';

interface ListenTogetherPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ListenTogetherPanel({ isOpen, onClose }: ListenTogetherPanelProps) {
    const { user, userProfile } = useAuth();
    const { currentSong, isPlaying, togglePlay, next, progress, duration, audioRef, playTrack, setListenerMode } = usePlayer();

    // Friends context for friend-related features
    const { friends, canUseListenTogether, getOnlineFriends } = useFriends();

    // Room context for Socket.io based rooms (FREE - no Firebase quota)
    const {
        isConnected,
        activeRoom,
        isInRoom,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        syncPlayback,
        transferHost,
        removeListener,
        banListener
    } = useRoom();

    const [view, setView] = useState<'menu' | 'room'>('menu');
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviteLoading, setInviteLoading] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showParticipantMenu, setShowParticipantMenu] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const lastSyncRef = useRef<number>(0);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync to room if active
    useEffect(() => {
        if (activeRoom) {
            setView('room');
            // Enable listener mode if user is NOT the host
            const userId = user?.uid;
            const isListener = userId ? activeRoom.hostId !== userId : true;
            setListenerMode(isListener);
        } else {
            setView('menu');
            // Disable listener mode when leaving room
            setListenerMode(false);
        }
    }, [activeRoom, user, setListenerMode]);

    // Host: Sync playback state periodically
    useEffect(() => {
        if (!activeRoom || !user) return;
        if (activeRoom.hostId !== user.uid) return;

        const doSync = () => {
            if (currentSong && audioRef.current) {
                syncPlayback(isPlaying, audioRef.current.currentTime, currentSong);
            }
        };

        doSync();

        if (isPlaying) {
            syncIntervalRef.current = setInterval(doSync, 2000);
        }

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [activeRoom, user, isPlaying, currentSong]);

    // Guest: Continuous sync to host's playback (polling every 500ms)
    useEffect(() => {
        if (!activeRoom || !user) return;
        if (activeRoom.hostId === user.uid) return;
        if (!audioRef.current) return;

        const syncToHost = () => {
            if (!audioRef.current || !activeRoom) return;

            const room = activeRoom;

            // Sync the song - if host is playing a different song, switch to it
            if (room.currentSong) {
                const hostSongId = room.currentSong.id;
                const currentSongId = currentSong?.id || currentSong?.songId;

                // If host's song is different, play it
                if (hostSongId && hostSongId !== currentSongId) {
                    playTrack({
                        id: room.currentSong.id,
                        name: room.currentSong.name,
                        artist: room.currentSong.artist,
                        image: room.currentSong.image,
                        audioUrl: room.currentSong.audioUrl
                    });
                    return;
                }
            }

            // FORCE pause sync - always enforce host's pause state
            if (!room.isPlaying && !audioRef.current.paused) {
                audioRef.current.pause();
            }

            // FORCE play sync - always enforce host's play state  
            if (room.isPlaying && audioRef.current.paused) {
                audioRef.current.play().catch(() => { });
            }

            // Sync time (with tolerance to prevent jitter)
            const timeDiff = Math.abs(audioRef.current.currentTime - room.currentTime);
            if (timeDiff > 3) {
                audioRef.current.currentTime = room.currentTime;
            }
        };

        // Initial sync
        syncToHost();

        // Continuous polling every 500ms to enforce host state
        const syncInterval = setInterval(syncToHost, 500);

        return () => {
            clearInterval(syncInterval);
        };
    }, [activeRoom, user, playTrack, currentSong]);

    const handleCreateRoom = async () => {
        if (!canUseListenTogether) return;
        setLoading(true);
        setError(null);
        try {
            await createRoom();
            setView('room');
        } catch (err: any) {
            setError(err.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!canUseListenTogether || !joinCode.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await joinRoom(joinCode.trim());
            setView('room');
        } catch (err: any) {
            setError(err.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        setLoading(true);
        try {
            await leaveRoom();
            setView('menu');
        } catch (err: any) {
            setError(err.message || 'Failed to leave room');
        } finally {
            setLoading(false);
        }
    };

    // Invite friend by sharing link (Socket.io based - no Firebase invite needed)
    const handleInviteFriend = async (friendId: string) => {
        // Just show them to copy the link
        if (activeRoom) {
            shareRoomLink();
            setInviteSuccess(friendId);
            setTimeout(() => setInviteSuccess(null), 2000);
        }
    };

    const handleAcceptInvite = async (roomId: string) => {
        setLoading(true);
        try {
            await joinRoom(roomId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTransferHost = async (userId: string) => {
        setActionLoading(userId);
        try {
            await transferHost(userId);
            setShowParticipantMenu(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveListener = async (userId: string) => {
        setActionLoading(userId);
        try {
            await removeListener(userId);
            setShowParticipantMenu(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBanListener = async (userId: string) => {
        setActionLoading(userId);
        try {
            await banListener(userId);
            setShowParticipantMenu(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const copyRoomId = () => {
        if (activeRoom) {
            navigator.clipboard.writeText(activeRoom.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareRoomLink = () => {
        if (activeRoom) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const shareUrl = `${baseUrl}/join/${activeRoom.id}`;
            navigator.clipboard.writeText(shareUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const onlineFriends = getOnlineFriends();
    // Access is binary now — any online friend can join, no plan filter.
    const eliteFriends = onlineFriends;

    // Not eligible - show upgrade prompt
    if (!canUseListenTogether) {
        return (
            <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150] flex items-end md:items-center justify-center md:p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ y: 48, scale: 0.97, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 48, scale: 0.97, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="bg-[var(--card)] rounded-t-3xl md:rounded-3xl border border-[var(--border)] w-full max-w-md p-6 text-center relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[var(--card-hover)] rounded-xl">
                        <X size={20} className="text-[var(--foreground-muted)]" />
                    </button>

                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} className="text-purple-400" />
                    </div>

                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        Approval required
                    </h2>
                    <p className="text-sm text-[var(--foreground-muted)] mb-6">
                        Listen Together lets you sync music playback with friends in real-time.
                        Your account needs admin approval to use it.
                    </p>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <Headphones size={18} />
                        Back to Home
                        <ChevronRight size={16} />
                    </Link>
                </motion.div>
            </motion.div>
            )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
        {isOpen && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150] flex items-end md:items-center justify-center md:p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ y: 48, scale: 0.97, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 48, scale: 0.97, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="bg-[var(--card)] rounded-t-3xl md:rounded-3xl border border-[var(--border)] w-full max-w-2xl max-h-[88vh] md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {view === 'room' && activeRoom ? (
                                <>
                                    <div className="relative shrink-0">
                                        {activeRoom.hostPhoto ? (
                                            <img src={activeRoom.hostPhoto} className="w-11 h-11 rounded-xl object-cover" alt="" />
                                        ) : (
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {activeRoom.hostName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[var(--card)] flex items-center justify-center">
                                            <Crown size={8} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-[var(--foreground)] truncate">
                                            {activeRoom.hostName}'s Room
                                        </h2>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            {activeRoom.participants.length} listener{activeRoom.participants.length !== 1 ? 's' : ''} • Code: <span className="font-mono text-purple-400">{activeRoom.id}</span>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl relative shrink-0">
                                        <Headphones size={18} className="text-white" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card)] animate-pulse" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-[var(--foreground)]">
                                            Listen Together
                                        </h2>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            Sync music with friends in real-time
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {view === 'room' && activeRoom && (
                                <button
                                    onClick={copyRoomId}
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[var(--card-hover)] rounded-xl text-xs font-bold hover:bg-[var(--background)] transition-colors"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {activeRoom.id}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--card-hover)] rounded-xl"
                            >
                                <X size={20} className="text-[var(--foreground-muted)]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border-b border-red-500/20 px-5 py-3"
                        >
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Socket.io Connection Status */}
                {!isConnected && view === 'menu' && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center gap-2">
                        <WifiOff size={14} className="text-amber-400" />
                        <p className="text-xs text-amber-400">Connecting to room server...</p>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {view === 'menu' ? (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-6 flex flex-col items-center justify-center h-full"
                            >
                                <div className="text-center mb-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                                        <Users size={40} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                        Listen Together
                                    </h3>
                                    <p className="text-sm text-[var(--foreground-muted)] max-w-sm">
                                        Create a room and invite friends to listen to the same music in perfect sync
                                    </p>
                                </div>

                                <div className="w-full max-w-sm space-y-4">
                                    <button
                                        onClick={handleCreateRoom}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Crown size={20} />
                                                Create Room
                                            </>
                                        )}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-[var(--border)]" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-4 bg-[var(--card)] text-xs text-[var(--foreground-muted)]">
                                                or join with code
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="Enter room code"
                                            maxLength={6}
                                            className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                        <button
                                            onClick={handleJoinRoom}
                                            disabled={!joinCode.trim() || loading}
                                            className="px-6 py-3 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl font-bold hover:border-purple-500/50 disabled:opacity-50 transition-colors"
                                        >
                                            <LinkIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="room"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col md:flex-row h-full overflow-hidden"
                            >
                                {/* Main Content */}
                                <div className="flex-1 p-5 flex flex-col overflow-y-auto">
                                    {/* Now Playing */}
                                    {activeRoom?.currentSong ? (
                                        <div className="bg-gradient-to-br from-[var(--card-hover)] to-[var(--background)] rounded-2xl p-5 mb-4 border border-[var(--border)]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-1.5">
                                                <Radio size={12} className="animate-pulse" />
                                                Now Playing
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={activeRoom.currentSong.image}
                                                    className="w-20 h-20 rounded-xl object-cover shadow-lg"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-lg text-[var(--foreground)] truncate">
                                                        {activeRoom.currentSong.name}
                                                    </p>
                                                    <p className="text-sm text-[var(--foreground-muted)] truncate">
                                                        {activeRoom.currentSong.artist}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Volume2 size={14} className="text-green-400" />
                                                        <div className="flex-1 h-1.5 bg-[var(--card)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                                                                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {isHost && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={togglePlay}
                                                            className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
                                                        >
                                                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={next}
                                                            className="p-3 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-full transition-colors"
                                                        >
                                                            <SkipForward size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : currentSong ? (
                                        <div className="bg-[var(--card-hover)] rounded-2xl p-5 mb-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">
                                                Your Current Track
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={typeof currentSong.image === 'string' ? currentSong.image : currentSong.image?.[currentSong.image.length - 1]?.url}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[var(--foreground)] truncate">{currentSong.name}</p>
                                                    <p className="text-sm text-[var(--foreground-muted)] truncate">
                                                        {currentSong.artists?.primary?.[0]?.name || currentSong.artist}
                                                    </p>
                                                </div>
                                                {isHost && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={togglePlay}
                                                            className="p-3 bg-violet-500 rounded-full text-white"
                                                        >
                                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                                        </button>
                                                        <button onClick={next} className="p-3 bg-[var(--card)] rounded-full">
                                                            <SkipForward size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--card-hover)] rounded-2xl p-6 mb-4 text-center">
                                            <Music size={32} className="text-[var(--foreground-muted)]/30 mx-auto mb-2" />
                                            <p className="text-sm text-[var(--foreground-muted)]">
                                                {isHost ? 'Start playing a song to sync with listeners' : 'Waiting for host to play a song...'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Participants Grid Layout */}
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">
                                            Listeners ({activeRoom?.participants.length || 0})
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {activeRoom?.participants.map((participantId) => {
                                                const details = activeRoom.participantDetails[participantId];
                                                const isParticipantHost = participantId === activeRoom.hostId;
                                                const isMe = participantId === user?.uid;
                                                const tierClass = details?.tier === 'NITRO_SUPREME'
                                                    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[var(--card)]'
                                                    : details?.tier === 'NITRO_ELITE'
                                                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[var(--card)]'
                                                        : isParticipantHost
                                                            ? 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-[var(--card)]'
                                                            : '';

                                                return (
                                                    <div
                                                        key={participantId}
                                                        className="flex flex-col items-center text-center group relative"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="relative mb-2">
                                                            {details?.photoURL ? (
                                                                <img
                                                                    src={details.photoURL}
                                                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ${tierClass}`}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${details?.tier === 'NITRO_SUPREME'
                                                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                                                    : details?.tier === 'NITRO_ELITE'
                                                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                                                    } ${tierClass}`}>
                                                                    {details?.displayName?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                            )}

                                                            {/* Host Crown Badge */}
                                                            {isParticipantHost && (
                                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                                                    <Crown size={10} className="text-white" />
                                                                </div>
                                                            )}

                                                            {/* Host Menu Button */}
                                                            {isHost && !isMe && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowParticipantMenu(showParticipantMenu === participantId ? null : participantId);
                                                                    }}
                                                                    className="absolute top-0 right-0 p-1 bg-[var(--card)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-[var(--border)]"
                                                                >
                                                                    <MoreVertical size={12} className="text-[var(--foreground-muted)]" />
                                                                </button>
                                                            )}

                                                            {/* Dropdown Menu */}
                                                            <AnimatePresence>
                                                                {showParticipantMenu === participantId && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-36 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-[200]"
                                                                    >
                                                                        <button
                                                                            onClick={() => handleTransferHost(participantId)}
                                                                            disabled={actionLoading === participantId}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                                        >
                                                                            <ArrowRightLeft size={12} />
                                                                            Make Host
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRemoveListener(participantId)}
                                                                            disabled={actionLoading === participantId}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"
                                                                        >
                                                                            <UserMinus size={12} />
                                                                            Remove
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleBanListener(participantId)}
                                                                            disabled={actionLoading === participantId}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                                                        >
                                                                            <Ban size={12} />
                                                                            Ban
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Name with Tier */}
                                                        <p className={`text-[10px] font-medium truncate max-w-full px-1 ${isParticipantHost
                                                            ? 'text-amber-400'
                                                            : details?.tier === 'NITRO_SUPREME'
                                                                ? 'text-amber-400'
                                                                : details?.tier === 'NITRO_ELITE'
                                                                    ? 'text-purple-400'
                                                                    : isMe
                                                                        ? 'text-cyan-400'
                                                                        : 'text-[var(--foreground)]'
                                                            }`}>
                                                            {details?.displayName?.split(' ')[0] || 'User'}
                                                            {isMe && ' (You)'}
                                                        </p>

                                                        {/* Role */}
                                                        <p className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider">
                                                            {isParticipantHost ? 'Host' : 'Listener'}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar - Invite Friends (Host Only) */}
                                {isHost && (
                                    <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-[var(--border)] p-4 bg-[var(--background)]/50 overflow-y-auto">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3 flex items-center gap-1.5">
                                            <UserPlus size={12} />
                                            Invite Friends
                                        </p>

                                        {eliteFriends.length === 0 ? (
                                            <div className="text-center py-6">
                                                <Sparkles size={24} className="text-[var(--foreground-muted)]/30 mx-auto mb-2" />
                                                <p className="text-xs text-[var(--foreground-muted)]">
                                                    No friends online
                                                </p>
                                                <p className="text-[10px] text-[var(--foreground-muted)]/60 mt-1">
                                                    Share the room code to invite anyone
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {eliteFriends.map(friend => (
                                                    <div
                                                        key={friend.id}
                                                        className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-xl"
                                                    >
                                                        <div className="relative shrink-0">
                                                            {friend.photoURL ? (
                                                                <img src={friend.photoURL} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                                    {friend.displayName[0]}
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-[var(--card)]" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-[var(--foreground)] truncate">
                                                                {friend.displayName}
                                                            </p>
                                                            <p className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleInviteFriend(friend.id)}
                                                            disabled={inviteLoading === friend.id || activeRoom?.participants.includes(friend.id)}
                                                            className={`p-1.5 rounded-lg transition-all ${inviteSuccess === friend.id
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : activeRoom?.participants.includes(friend.id)
                                                                    ? 'bg-[var(--card-hover)] text-[var(--foreground-muted)]'
                                                                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                                                                }`}
                                                        >
                                                            {inviteLoading === friend.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : inviteSuccess === friend.id ? (
                                                                <Check size={12} />
                                                            ) : activeRoom?.participants.includes(friend.id) ? (
                                                                <Check size={12} />
                                                            ) : (
                                                                <UserPlus size={12} />
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Share Options */}
                                        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                                                Share Room
                                            </p>

                                            <button
                                                onClick={copyRoomId}
                                                className="w-full flex items-center justify-between gap-2 p-3 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-xl transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Copy size={14} className="text-[var(--foreground-muted)]" />
                                                    <span className="text-[var(--foreground-muted)]">Code:</span>
                                                    <span className="font-mono font-bold text-purple-400 tracking-wider">{activeRoom?.id}</span>
                                                </div>
                                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[var(--foreground-muted)]" />}
                                            </button>

                                            <button
                                                onClick={shareRoomLink}
                                                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-xl transition-colors"
                                            >
                                                {linkCopied ? (
                                                    <>
                                                        <Check size={14} className="text-green-400" />
                                                        <span className="text-xs font-bold text-green-400">Link Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Share2 size={14} className="text-purple-400" />
                                                        <span className="text-xs font-bold text-purple-400">Copy Invite Link</span>
                                                        <ExternalLink size={12} className="text-purple-400/60" />
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-[9px] text-[var(--foreground-muted)]/60 text-center">
                                                Anyone with the link can join
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer - Leave Button */}
                {view === 'room' && (
                    <div className="p-4 border-t border-[var(--border)] shrink-0">
                        <button
                            onClick={handleLeaveRoom}
                            disabled={loading}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (isHost ? 'End Room' : 'Leave Room')}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
        )}
        </AnimatePresence>
    );
}

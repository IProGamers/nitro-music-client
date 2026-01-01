"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/context/FriendsContext';
import { useRoom } from '@/context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Loader2, Crown, Users, AlertCircle, LogIn, Zap, Music } from 'lucide-react';
import Link from 'next/link';

export default function JoinRoomPage() {
    const params = useParams();
    const router = useRouter();
    const code = (params.code as string)?.toUpperCase();

    const { user, loading: authLoading } = useAuth();
    const { canUseListenTogether } = useFriends();
    const { joinRoom, activeRoom, getRoomInfo, isConnected } = useRoom();

    const [roomInfo, setRoomInfo] = useState<{
        hostName: string;
        hostPhoto: string | null;
        participants: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch room info via Socket.io
    useEffect(() => {
        if (!code) {
            setError('Invalid room code');
            setLoading(false);
            return;
        }

        if (!isConnected) {
            // Wait for socket connection
            return;
        }

        const fetchRoom = async () => {
            try {
                const room = await getRoomInfo(code);

                if (!room) {
                    setError('Room not found. It may have ended.');
                    setLoading(false);
                    return;
                }

                setRoomInfo({
                    hostName: room.hostName || 'Host',
                    hostPhoto: room.hostPhoto || null,
                    participants: room.participants?.length || 1
                });
                setLoading(false);
            } catch (err) {
                console.error('Error fetching room:', err);
                setError('Failed to load room info');
                setLoading(false);
            }
        };

        fetchRoom();
    }, [code, isConnected, getRoomInfo]);

    // If already in this room, redirect to home
    useEffect(() => {
        if (activeRoom?.id === code) {
            router.push('/');
        }
    }, [activeRoom, code, router]);

    const handleJoin = async () => {
        if (!user) {
            // Store the room code in localStorage and redirect to auth
            localStorage.setItem('pendingRoomJoin', code);
            router.push('/auth');
            return;
        }

        if (!canUseListenTogether) {
            return; // Show upgrade prompt instead
        }

        setJoining(true);
        setError(null);

        try {
            await joinRoom(code);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to join room');
            setJoining(false);
        }
    };

    // Loading state
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                        <Loader2 size={32} className="text-white animate-spin" />
                    </div>
                    <p className="text-[var(--foreground-muted)]">Loading room...</p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error && !roomInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} className="text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                        Room Not Found
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] mb-6">
                        {error}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-colors"
                    >
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 md:p-8 max-w-md w-full"
            >
                {/* Room Info */}
                <div className="text-center mb-6">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        {roomInfo?.hostPhoto ? (
                            <img
                                src={roomInfo.hostPhoto}
                                className="w-20 h-20 rounded-full object-cover border-4 border-purple-500/20"
                                alt=""
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {roomInfo?.hostName[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full border-4 border-[var(--card)] flex items-center justify-center">
                            <Crown size={14} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
                        {roomInfo?.hostName}'s Room
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] flex items-center justify-center gap-2">
                        <Users size={14} />
                        {roomInfo?.participants} listener{roomInfo?.participants !== 1 ? 's' : ''} • Code: <span className="font-mono text-purple-400">{code}</span>
                    </p>
                </div>

                {/* Feature Info */}
                <div className="bg-[var(--background)] rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Headphones size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-[var(--foreground)]">Listen Together</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Sync music in real-time</p>
                        </div>
                    </div>
                    <ul className="text-xs text-[var(--foreground-muted)] space-y-1.5 ml-12">
                        <li className="flex items-center gap-2">
                            <Music size={12} className="text-cyan-400" />
                            Hear the same song at the same time
                        </li>
                        <li className="flex items-center gap-2">
                            <Users size={12} className="text-cyan-400" />
                            Listen with friends together
                        </li>
                    </ul>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 rounded-xl p-3 mb-4"
                        >
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                {!user ? (
                    <div className="space-y-3">
                        <button
                            onClick={handleJoin}
                            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
                        >
                            <LogIn size={20} />
                            Sign In to Join
                        </button>
                        <p className="text-xs text-center text-[var(--foreground-muted)]">
                            You need an account to join Listen Together rooms
                        </p>
                    </div>
                ) : !canUseListenTogether ? (
                    <div className="space-y-3">
                        <Link
                            href="/upgrade"
                            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
                        >
                            <Zap size={20} />
                            Upgrade to Elite to Join
                        </Link>
                        <p className="text-xs text-center text-[var(--foreground-muted)]">
                            Listen Together requires Elite or Supreme plan
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-500/20"
                    >
                        {joining ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Headphones size={20} />
                                Join Room
                            </>
                        )}
                    </button>
                )}

                {/* Back link */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                        ← Back to Nitro
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

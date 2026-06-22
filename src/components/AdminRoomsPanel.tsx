"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRoom } from '@/context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Headphones, Users, Crown, Eye, EyeOff, Loader2, Trash2,
    RefreshCw, Music, Radio, UserX, X, AlertCircle, Globe, Lock
} from 'lucide-react';

interface RoomData {
    id: string;
    hostId: string;
    hostName: string;
    hostPhoto: string | null;
    isPublic?: boolean;
    participants: string[];
    participantDetails: { [key: string]: { displayName: string; photoURL: string | null } };
    currentSong: {
        name: string;
        artist: string;
        image: string;
    } | null;
    isPlaying: boolean;
    createdAt: Date;
}

export default function AdminRoomsPanel() {
    const { userProfile } = useAuth();
    const { getAllRooms, joinRoom, leaveRoom, activeRoom } = useRoom();

    const [rooms, setRooms] = useState<RoomData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const isAdmin = userProfile?.isAdmin;

    const fetchRooms = async () => {
        if (!isAdmin) return;

        setLoading(true);
        setError(null);

        try {
            const roomsData = await getAllRooms();
            setRooms(roomsData as RoomData[]);
        } catch (err: any) {
            console.error('Error fetching rooms:', err);
            setError('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && isAdmin) {
            fetchRooms();
        }
    }, [isOpen, isAdmin]);

    const handleSecretJoin = async (roomId: string) => {
        setActionLoading(roomId);
        try {
            // Join secretly - pass true for admin secret join
            await joinRoom(roomId, true);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to join room');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeaveRoom = async () => {
        setActionLoading('leave');
        try {
            await leaveRoom();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isAdmin) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-xl transition-colors"
            >
                <Headphones size={18} className="text-purple-400" />
                <span className="text-sm font-bold text-purple-400">Listen Rooms</span>
                {rooms.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-md">
                        {rooms.length}
                    </span>
                )}
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[var(--card)] rounded-3xl border border-[var(--border)] w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                                        <Headphones size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-[var(--foreground)]">
                                            Active Listen Rooms
                                        </h2>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            Monitor and manage all ongoing rooms (via Socket.io)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={fetchRooms}
                                        disabled={loading}
                                        className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={18} className={`text-[var(--foreground-muted)] ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-[var(--foreground-muted)]" />
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3">
                                    <p className="text-sm text-red-400 flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Currently in room notice */}
                            {activeRoom && (
                                <div className="bg-purple-500/10 border-b border-purple-500/20 px-5 py-3 flex items-center justify-between">
                                    <p className="text-sm text-purple-400">
                                        You're currently in <span className="font-bold">{activeRoom.hostName}'s Room</span> (secretly)
                                    </p>
                                    <button
                                        onClick={handleLeaveRoom}
                                        disabled={actionLoading === 'leave'}
                                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-colors"
                                    >
                                        {actionLoading === 'leave' ? <Loader2 size={12} className="animate-spin" /> : 'Leave'}
                                    </button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-48">
                                        <Loader2 size={32} className="animate-spin text-purple-400 mb-3" />
                                        <p className="text-sm text-[var(--foreground-muted)]">Loading rooms...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-center">
                                        <div className="w-16 h-16 bg-[var(--card-hover)] rounded-full flex items-center justify-center mb-4">
                                            <Headphones size={28} className="text-[var(--foreground-muted)]/30" />
                                        </div>
                                        <p className="text-[var(--foreground-muted)]">No active rooms</p>
                                        <p className="text-xs text-[var(--foreground-muted)]/60 mt-1">
                                            Rooms will appear here when users create them
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {rooms.map(room => (
                                            <div
                                                key={room.id}
                                                className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4"
                                            >
                                                {/* Room Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {room.hostPhoto ? (
                                                                <img src={room.hostPhoto} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                                                    {room.hostName[0]?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                                                <Crown size={10} className="text-white" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[var(--foreground)] flex items-center gap-2">
                                                                {room.hostName}'s Room
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${room.isPublic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--card-hover)] text-[var(--foreground-muted)]'}`}>
                                                                    {room.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                                                                    {room.isPublic ? 'Public' : 'Private'}
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                                Code: <span className="font-mono text-purple-400">{room.id}</span> • {room.participants.length} listeners
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleSecretJoin(room.id)}
                                                            disabled={actionLoading === room.id || activeRoom?.id === room.id}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            {actionLoading === room.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : activeRoom?.id === room.id ? (
                                                                <>
                                                                    <Eye size={12} />
                                                                    Watching
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <EyeOff size={12} />
                                                                    Join Secretly
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Now Playing */}
                                                {room.currentSong && (
                                                    <div className="bg-[var(--card)] rounded-xl p-3 mb-3 flex items-center gap-3">
                                                        <img src={room.currentSong.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Radio size={12} className={`${room.isPlaying ? 'text-green-400 animate-pulse' : 'text-[var(--foreground-muted)]'}`} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                                                                    {room.isPlaying ? 'Now Playing' : 'Paused'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                                                {room.currentSong.name}
                                                            </p>
                                                            <p className="text-xs text-[var(--foreground-muted)] truncate">
                                                                {room.currentSong.artist}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Participants */}
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                                        Participants
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {room.participants.map(participantId => {
                                                            const details = room.participantDetails[participantId];
                                                            const isHostParticipant = participantId === room.hostId;

                                                            return (
                                                                <div
                                                                    key={participantId}
                                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isHostParticipant ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[var(--card)]'
                                                                        }`}
                                                                >
                                                                    {details?.photoURL ? (
                                                                        <img src={details.photoURL} className="w-6 h-6 rounded-full object-cover" alt="" />
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                                            {details?.displayName?.[0]?.toUpperCase() || '?'}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-xs font-medium text-[var(--foreground)]">
                                                                        {details?.displayName || 'Unknown'}
                                                                    </span>
                                                                    {isHostParticipant && (
                                                                        <Crown size={10} className="text-amber-400" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

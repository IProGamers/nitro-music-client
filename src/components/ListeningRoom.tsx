"use client"
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    X, Users, Music, Send, Crown, Play, Pause,
    SkipForward, Mic, MicOff, Copy, Check, UserPlus
} from 'lucide-react';

interface ListeningRoomProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RoomMember {
    id: string;
    name: string;
    avatar: string | null;
    isHost: boolean;
    isSpeaking: boolean;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
}

export default function ListeningRoom({ isOpen, onClose }: ListeningRoomProps) {
    const { user, userProfile } = useAuth();
    const { currentSong, isPlaying, togglePlay, next } = usePlayer();

    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [view, setView] = useState<'menu' | 'room'>('menu');

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Create new room
    const createRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(newRoomId);
        setIsHost(true);
        setMembers([{
            id: user?.uid || 'host',
            name: userProfile?.displayName || 'Host',
            avatar: userProfile?.photoURL || null,
            isHost: true,
            isSpeaking: false
        }]);
        setView('room');
    };

    // Join existing room
    const joinRoom = () => {
        if (!joinCode.trim()) return;
        setRoomId(joinCode.toUpperCase());
        setIsHost(false);
        setMembers([
            {
                id: 'host',
                name: 'Room Host',
                avatar: null,
                isHost: true,
                isSpeaking: false
            },
            {
                id: user?.uid || 'guest',
                name: userProfile?.displayName || 'Guest',
                avatar: userProfile?.photoURL || null,
                isHost: false,
                isSpeaking: false
            }
        ]);
        setView('room');
    };

    // Send chat message
    const sendMessage = () => {
        if (!newMessage.trim()) return;

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            userId: user?.uid || 'anonymous',
            userName: userProfile?.displayName || 'You',
            message: newMessage,
            timestamp: new Date()
        }]);
        setNewMessage('');
    };

    // Copy room code
    const copyRoomCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Leave room
    const leaveRoom = () => {
        setRoomId(null);
        setIsHost(false);
        setMembers([]);
        setMessages([]);
        setView('menu');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                            <Users size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[var(--foreground)]">
                                {view === 'room' ? `Room: ${roomId}` : 'Listening Rooms'}
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {view === 'room' ? `${members.length} listeners` : 'Listen together with friends'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {view === 'room' && (
                            <button
                                onClick={copyRoomCode}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--card-hover)] rounded-xl text-xs font-bold"
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {roomId}
                            </button>
                        )}
                        <button onClick={view === 'room' ? leaveRoom : onClose} className="p-2 hover:bg-[var(--card-hover)] rounded-xl">
                            <X size={20} className="text-[var(--foreground-muted)]" />
                        </button>
                    </div>
                </div>

                {view === 'menu' ? (
                    /* Menu View */
                    <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
                        <div className="text-center mb-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={40} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Collaborative Listening</h3>
                            <p className="text-sm text-[var(--foreground-muted)]">Create or join a room to listen with friends in real-time</p>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                            <button
                                onClick={createRoom}
                                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                            >
                                <Crown size={20} />
                                Create Room
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--border)]" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-3 bg-[var(--card)] text-xs text-[var(--foreground-muted)]">or</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Enter room code"
                                    maxLength={6}
                                    className="flex-1 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest uppercase focus:outline-none focus:border-violet-400"
                                />
                                <button
                                    onClick={joinRoom}
                                    disabled={!joinCode.trim()}
                                    className="px-6 py-3 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl font-bold hover:border-violet-400 disabled:opacity-50 transition-colors"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Room View */
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Main Content */}
                        <div className="flex-1 p-5 flex flex-col">
                            {/* Now Playing */}
                            {currentSong && (
                                <div className="bg-[var(--card-hover)] rounded-2xl p-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={currentSong.image}
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
                                                <button
                                                    onClick={next}
                                                    className="p-3 bg-[var(--card)] rounded-full"
                                                >
                                                    <SkipForward size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div className="mb-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Listeners</p>
                                <div className="flex -space-x-2">
                                    {members.map(member => (
                                        <div
                                            key={member.id}
                                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center border-2 ${member.isHost ? 'border-amber-400' : 'border-[var(--card)]'} relative`}
                                        >
                                            {member.avatar ? (
                                                <img src={member.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                                            ) : (
                                                <span className="text-xs font-bold text-white">{member.name[0]}</span>
                                            )}
                                            {member.isHost && (
                                                <Crown size={10} className="absolute -top-1 -right-1 text-amber-400" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat */}
                            <div className="flex-1 bg-[var(--background)] rounded-2xl p-4 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {messages.map(msg => (
                                        <div key={msg.id} className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-violet-400">{msg.userName[0]}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-violet-400">{msg.userName}</span>
                                                <p className="text-sm text-[var(--foreground)]">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Say something..."
                                        className="flex-1 bg-[var(--card)] rounded-xl px-4 py-2 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="p-2 bg-violet-500 text-white rounded-xl"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

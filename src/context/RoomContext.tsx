"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Listen Room interface
export interface ListenRoom {
    id: string;
    hostId: string;
    hostName: string;
    hostPhoto: string | null;
    participants: string[];
    participantDetails: { [key: string]: { id: string; displayName: string; photoURL: string | null; tier?: string; joinedAt: Date } };
    bannedUsers: string[];
    currentSong: {
        id: string;
        name: string;
        artist: string;
        image: string;
        audioUrl: string;
    } | null;
    isPlaying: boolean;
    currentTime: number;
    lastSyncAt: Date;
    createdAt: Date;
}

interface RoomContextType {
    // Connection
    isConnected: boolean;

    // Room State
    activeRoom: ListenRoom | null;
    isInRoom: boolean;
    isHost: boolean;

    // Actions
    createRoom: () => Promise<ListenRoom>;
    joinRoom: (roomId: string, isAdmin?: boolean) => Promise<ListenRoom>;
    leaveRoom: () => Promise<void>;
    syncPlayback: (isPlaying: boolean, currentTime: number, song?: any) => void;
    transferHost: (newHostId: string) => Promise<void>;
    removeListener: (userId: string) => Promise<void>;
    banListener: (userId: string) => Promise<void>;

    // Admin
    getAllRooms: () => Promise<ListenRoom[]>;

    // Room Info
    getRoomInfo: (roomId: string) => Promise<ListenRoom | null>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Use separate socket server URL (for Render deployment) or fall back to API URL (local dev)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, userProfile } = useAuth();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeRoom, setActiveRoom] = useState<ListenRoom | null>(null);

    const lastSyncRef = useRef<number>(0);

    const isInRoom = !!activeRoom;
    const isHost = activeRoom?.hostId === user?.uid;

    // Initialize Socket connection
    useEffect(() => {
        if (!user || !userProfile) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected');
            setIsConnected(true);

            // Authenticate
            newSocket.emit('auth', {
                userId: user.uid,
                displayName: userProfile.displayName,
                photoURL: userProfile.photoURL
            });
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        // Room events
        newSocket.on('room:joined', (room: ListenRoom) => {
            setActiveRoom(room);
        });

        newSocket.on('room:sync_update', (data) => {
            setActiveRoom(prev => prev ? {
                ...prev,
                isPlaying: data.isPlaying,
                currentTime: data.currentTime,
                currentSong: data.currentSong || prev.currentSong,
                lastSyncAt: new Date(data.lastSyncAt)
            } : null);
        });

        newSocket.on('room:participant_joined', (data) => {
            setActiveRoom(prev => {
                if (!prev) return null;
                const newParticipants = [...prev.participants, data.userId];
                const newDetails = {
                    ...prev.participantDetails,
                    [data.userId]: {
                        id: data.userId,
                        displayName: data.displayName,
                        photoURL: data.photoURL,
                        tier: data.tier,
                        joinedAt: new Date()
                    }
                };
                return { ...prev, participants: newParticipants, participantDetails: newDetails };
            });
        });

        newSocket.on('room:participant_left', (data) => {
            setActiveRoom(prev => {
                if (!prev) return null;
                const newParticipants = prev.participants.filter(p => p !== data.userId);
                const newDetails = { ...prev.participantDetails };
                delete newDetails[data.userId];
                return { ...prev, participants: newParticipants, participantDetails: newDetails };
            });
        });

        newSocket.on('room:host_changed', (data) => {
            setActiveRoom(prev => prev ? {
                ...prev,
                hostId: data.newHostId,
                hostName: data.hostName,
                hostPhoto: data.hostPhoto
            } : null);
        });

        newSocket.on('room:ended', () => {
            setActiveRoom(null);
        });

        newSocket.on('room:removed', () => {
            setActiveRoom(null);
        });

        newSocket.on('room:banned', () => {
            setActiveRoom(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?.uid, userProfile?.displayName]);

    // Create Room
    const createRoom = useCallback(async (): Promise<ListenRoom> => {
        if (!socket || !user || !userProfile) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            socket.emit('room:create', {
                userId: user.uid,
                displayName: userProfile.displayName,
                photoURL: userProfile.photoURL,
                tier: userProfile.tier
            }, (response: any) => {
                if (response.success) {
                    setActiveRoom(response.room);
                    resolve(response.room);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, [socket, user, userProfile]);

    // Join Room
    const joinRoom = useCallback(async (roomId: string, isAdmin = false): Promise<ListenRoom> => {
        if (!socket || !user || !userProfile) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            socket.emit('room:join', {
                roomId,
                userId: user.uid,
                displayName: userProfile.displayName,
                photoURL: userProfile.photoURL,
                tier: userProfile.tier,
                isAdmin
            }, (response: any) => {
                if (response.success) {
                    setActiveRoom(response.room);
                    resolve(response.room);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, [socket, user, userProfile]);

    // Leave Room
    const leaveRoom = useCallback(async () => {
        if (!socket || !user) return;

        return new Promise<void>((resolve, reject) => {
            socket.emit('room:leave', { userId: user.uid }, (response: any) => {
                if (response.success) {
                    setActiveRoom(null);
                    resolve();
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, [socket, user]);

    // Sync Playback (throttled - host only)
    const syncPlayback = useCallback((isPlaying: boolean, currentTime: number, song?: any) => {
        if (!socket || !user || !activeRoom) return;
        if (activeRoom.hostId !== user.uid) return;

        // Throttle to 1 sync per second
        const now = Date.now();
        if (now - lastSyncRef.current < 1000) return;
        lastSyncRef.current = now;

        socket.emit('room:sync', {
            userId: user.uid,
            isPlaying,
            currentTime,
            song
        });
    }, [socket, user, activeRoom]);

    // Transfer Host
    const transferHost = useCallback(async (newHostId: string) => {
        if (!socket || !user) throw new Error('Not connected');

        return new Promise<void>((resolve, reject) => {
            socket.emit('room:transfer_host', { userId: user.uid, newHostId }, (response: any) => {
                if (response.success) resolve();
                else reject(new Error(response.error));
            });
        });
    }, [socket, user]);

    // Remove Listener
    const removeListener = useCallback(async (targetId: string) => {
        if (!socket || !user) throw new Error('Not connected');

        return new Promise<void>((resolve, reject) => {
            socket.emit('room:remove_listener', { userId: user.uid, targetId }, (response: any) => {
                if (response.success) resolve();
                else reject(new Error(response.error));
            });
        });
    }, [socket, user]);

    // Ban Listener
    const banListener = useCallback(async (targetId: string) => {
        if (!socket || !user) throw new Error('Not connected');

        return new Promise<void>((resolve, reject) => {
            socket.emit('room:ban_listener', { userId: user.uid, targetId }, (response: any) => {
                if (response.success) resolve();
                else reject(new Error(response.error));
            });
        });
    }, [socket, user]);

    // Get Room Info
    const getRoomInfo = useCallback(async (roomId: string): Promise<ListenRoom | null> => {
        if (!socket) return null;

        return new Promise((resolve) => {
            socket.emit('room:info', { roomId }, (response: any) => {
                if (response.success) resolve(response.room);
                else resolve(null);
            });
        });
    }, [socket]);

    // Get All Rooms (Admin)
    const getAllRooms = useCallback(async (): Promise<ListenRoom[]> => {
        if (!socket) return [];

        return new Promise((resolve) => {
            socket.emit('admin:get_rooms', (response: any) => {
                if (response.success) resolve(response.rooms);
                else resolve([]);
            });
        });
    }, [socket]);

    const value = useMemo(() => ({
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
        banListener,
        getAllRooms,
        getRoomInfo
    }), [
        isConnected, activeRoom, isInRoom, isHost,
        createRoom, joinRoom, leaveRoom, syncPlayback,
        transferHost, removeListener, banListener, getAllRooms, getRoomInfo
    ]);

    return (
        <RoomContext.Provider value={value}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => {
    const context = useContext(RoomContext);
    if (!context) throw new Error("useRoom must be used within RoomProvider");
    return context;
};

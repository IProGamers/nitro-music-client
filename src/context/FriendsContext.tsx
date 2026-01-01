"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth, SubscriptionTier, UserStatus } from './AuthContext';

// Friend request status types
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

// Friend request interface
export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUserName: string;
    fromUserPhoto: string | null;
    status: FriendRequestStatus;
    createdAt: Date;
}

// Friend interface (accepted friend)
export interface Friend {
    id: string;
    displayName: string;
    username: string | null;
    photoURL: string | null;
    status: UserStatus;
    tier: SubscriptionTier;
    nowPlaying: {
        songId: string;
        songName: string;
        artistName: string;
        image: string;
        startedAt: Date;
        currentTime: number;
    } | null;
    lastActive: Date;
    isOnline: boolean;
}

// Listen Together Room
export interface ListenRoom {
    id: string;
    hostId: string;
    hostName: string;
    hostPhoto: string | null;
    participants: string[];
    participantDetails: { [key: string]: { displayName: string; photoURL: string | null; joinedAt: Date } };
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

interface FriendsContextType {
    friends: Friend[];
    loadingFriends: boolean;
    pendingRequests: FriendRequest[];
    sentRequests: FriendRequest[];
    loadingRequests: boolean;
    sendFriendRequest: (toUserId: string, toUserName: string) => Promise<void>;
    acceptFriendRequest: (requestId: string, fromUserId: string) => Promise<void>;
    declineFriendRequest: (requestId: string) => Promise<void>;
    cancelFriendRequest: (requestId: string) => Promise<void>;
    removeFriend: (friendId: string) => Promise<void>;
    activeRoom: ListenRoom | null;
    isInRoom: boolean;
    canUseListenTogether: boolean;
    createListenRoom: () => Promise<string>;
    joinListenRoom: (roomId: string, isAdmin?: boolean) => Promise<void>;
    leaveListenRoom: () => Promise<void>;
    syncPlayback: (isPlaying: boolean, currentTime: number, song?: any) => Promise<void>;
    inviteFriendToRoom: (friendId: string) => Promise<void>;
    transferHost: (newHostId: string) => Promise<void>;
    removeListener: (userId: string) => Promise<void>;
    banListener: (userId: string) => Promise<void>;
    roomInvites: { roomId: string; hostName: string; hostId: string }[];
    getFriendStatus: (userId: string) => 'none' | 'pending_sent' | 'pending_received' | 'friends';
    getOnlineFriends: () => Friend[];
    refreshFriends: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Helper to check if an error is a quota exceeded error (should be silenced)
const isQuotaError = (err: any): boolean => {
    return err?.code === 'resource-exhausted' ||
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('resource-exhausted');
};

// Generate simple 5-character room code
const generateSimpleCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Cache for friends data to reduce reads
const friendsCache = new Map<string, { data: Friend; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const FriendsProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, userProfile } = useAuth();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [activeRoom, setActiveRoom] = useState<ListenRoom | null>(null);
    const [roomInvites, setRoomInvites] = useState<{ roomId: string; hostName: string; hostId: string }[]>([]);

    const roomUnsubRef = useRef<(() => void) | null>(null);
    const lastSyncRef = useRef<number>(0);
    const friendsFetchedRef = useRef<boolean>(false);

    const canUseListenTogether = useMemo(() => {
        if (!userProfile) return false;
        return userProfile.tier === 'NITRO_ELITE' || userProfile.tier === 'NITRO_SUPREME' || userProfile.isAdmin;
    }, [userProfile?.tier, userProfile?.isAdmin]);

    const isInRoom = !!activeRoom;

    // ========== FRIEND REQUESTS LISTENER (Optimized - only when user exists) ==========
    useEffect(() => {
        if (!user) {
            setPendingRequests([]);
            setSentRequests([]);
            setLoadingRequests(false);
            return;
        }

        setLoadingRequests(true);

        // Only listen for incoming requests - reduces reads
        const incomingQuery = query(
            collection(db, 'friendRequests'),
            where('toUserId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const requests: FriendRequest[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as FriendRequest));
            setPendingRequests(requests);
            setLoadingRequests(false);
        }, (error: any) => {
            // Silently handle quota errors - user can't do anything about them
            if (error?.code !== 'resource-exhausted') {
                console.error('Error listening to friend requests:', error);
            }
            setLoadingRequests(false);
        });

        // Fetch sent requests once, not as a listener (saves reads)
        const fetchSentRequests = async () => {
            try {
                const sentQuery = query(
                    collection(db, 'friendRequests'),
                    where('fromUserId', '==', user.uid),
                    where('status', '==', 'pending')
                );
                const snapshot = await getDocs(sentQuery);
                const requests: FriendRequest[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                } as FriendRequest));
                setSentRequests(requests);
            } catch (error) {
                console.error('Error fetching sent requests:', error);
            }
        };
        fetchSentRequests();

        // NOTE: Friend request cleanup removed to avoid Firestore index requirement
        // Old requests will be cleaned up manually or via a Cloud Function if needed

        return () => {
            unsubIncoming();
        };
    }, [user?.uid]);

    // ========== FRIENDS - FETCH ONCE (not real-time to save quota) ==========
    const refreshFriends = useCallback(async () => {
        if (!user) {
            setFriends([]);
            setLoadingFriends(false);
            return;
        }

        setLoadingFriends(true);
        try {
            const friendsRef = collection(db, 'users', user.uid, 'friends');
            const snapshot = await getDocs(friendsRef);
            const friendIds = snapshot.docs.map(doc => doc.id);

            if (friendIds.length === 0) {
                setFriends([]);
                setLoadingFriends(false);
                return;
            }

            const friendsData: Friend[] = [];
            const now = Date.now();

            for (const friendId of friendIds) {
                // Check cache first
                const cached = friendsCache.get(friendId);
                if (cached && (now - cached.timestamp) < CACHE_TTL) {
                    friendsData.push(cached.data);
                    continue;
                }

                const friendRef = doc(db, 'users', friendId);
                const friendSnap = await getDoc(friendRef);

                if (friendSnap.exists()) {
                    const data = friendSnap.data();
                    const lastActive = data.lastActive?.toDate?.() || new Date();
                    const isOnline = data.status === 'online' ||
                        (Date.now() - lastActive.getTime() < 5 * 60 * 1000);

                    const friend: Friend = {
                        id: friendId,
                        displayName: data.displayName || 'User',
                        username: data.username || null,
                        photoURL: data.photoURL || null,
                        status: data.status || 'offline',
                        tier: data.tier || 'NITRO_CORE',
                        nowPlaying: data.nowPlaying || null,
                        lastActive: lastActive,
                        isOnline
                    };

                    friendsData.push(friend);
                    friendsCache.set(friendId, { data: friend, timestamp: now });
                }
            }

            setFriends(friendsData);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
        setLoadingFriends(false);
    }, [user?.uid]);

    // Initial friends fetch (once only)
    useEffect(() => {
        if (user && !friendsFetchedRef.current) {
            friendsFetchedRef.current = true;
            refreshFriends();
        }
        if (!user) {
            friendsFetchedRef.current = false;
            setFriends([]);
            setLoadingFriends(false);
        }
    }, [user?.uid, refreshFriends]);

    // ========== LISTEN ROOM LISTENER ==========
    useEffect(() => {
        if (!user || !canUseListenTogether) {
            setActiveRoom(null);
            if (roomUnsubRef.current) {
                roomUnsubRef.current();
                roomUnsubRef.current = null;
            }
            return;
        }

        const roomRef = doc(db, 'users', user.uid, 'activeRoom', 'current');

        const unsub = onSnapshot(roomRef, async (snap) => {
            if (snap.exists()) {
                const roomId = snap.data().roomId;

                if (roomUnsubRef.current) {
                    roomUnsubRef.current();
                }

                const roomDocRef = doc(db, 'listenRooms', roomId);
                roomUnsubRef.current = onSnapshot(roomDocRef, (roomSnap) => {
                    if (roomSnap.exists()) {
                        const data = roomSnap.data();

                        if (data.bannedUsers?.includes(user.uid)) {
                            setActiveRoom(null);
                            deleteDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'));
                            return;
                        }

                        setActiveRoom({
                            id: roomSnap.id,
                            hostId: data.hostId,
                            hostName: data.hostName,
                            hostPhoto: data.hostPhoto || null,
                            participants: data.participants || [],
                            participantDetails: data.participantDetails || {},
                            bannedUsers: data.bannedUsers || [],
                            currentSong: data.currentSong || null,
                            isPlaying: data.isPlaying || false,
                            currentTime: data.currentTime || 0,
                            lastSyncAt: data.lastSyncAt?.toDate() || new Date(),
                            createdAt: data.createdAt?.toDate() || new Date()
                        });
                    } else {
                        setActiveRoom(null);
                        deleteDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'));
                    }
                }, (error) => {
                    console.error('Error listening to room:', error);
                    setActiveRoom(null);
                });
            } else {
                setActiveRoom(null);
                if (roomUnsubRef.current) {
                    roomUnsubRef.current();
                    roomUnsubRef.current = null;
                }
            }
        }, (error) => {
            console.error('Error listening to active room:', error);
        });

        return () => {
            unsub();
            if (roomUnsubRef.current) {
                roomUnsubRef.current();
                roomUnsubRef.current = null;
            }
        };
    }, [user?.uid, canUseListenTogether]);

    // ========== ROOM INVITES - FETCH ONCE (not real-time) ==========
    useEffect(() => {
        if (!user || !canUseListenTogether) {
            setRoomInvites([]);
            return;
        }

        const fetchInvites = async () => {
            try {
                const invitesRef = collection(db, 'users', user.uid, 'roomInvites');
                const snapshot = await getDocs(invitesRef);
                const invites = snapshot.docs.map(doc => ({
                    roomId: doc.id,
                    hostName: doc.data().hostName,
                    hostId: doc.data().hostId
                }));
                setRoomInvites(invites);
            } catch (error) {
                if (!isQuotaError(error)) console.error('Error fetching room invites:', error);
            }
        };

        fetchInvites();
    }, [user?.uid, canUseListenTogether]);

    // ========== FRIEND REQUEST ACTIONS ==========
    const sendFriendRequest = useCallback(async (toUserId: string, toUserName: string) => {
        if (!user || !userProfile) throw new Error('Not authenticated');
        if (toUserId === user.uid) throw new Error('Cannot send request to yourself');

        const friendRef = doc(db, 'users', user.uid, 'friends', toUserId);
        const friendSnap = await getDoc(friendRef);
        if (friendSnap.exists()) throw new Error('Already friends');

        const existingQuery = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', user.uid),
            where('toUserId', '==', toUserId),
            where('status', '==', 'pending')
        );
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) throw new Error('Request already sent');

        const requestId = `${user.uid}_${toUserId}_${Date.now()}`;
        await setDoc(doc(db, 'friendRequests', requestId), {
            fromUserId: user.uid,
            toUserId: toUserId,
            fromUserName: userProfile.displayName || 'User',
            fromUserPhoto: userProfile.photoURL || null,
            toUserName: toUserName,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // Update local state
        setSentRequests(prev => [...prev, {
            id: requestId,
            fromUserId: user.uid,
            toUserId,
            fromUserName: userProfile.displayName || 'User',
            fromUserPhoto: userProfile.photoURL || null,
            status: 'pending',
            createdAt: new Date()
        }]);
    }, [user, userProfile]);

    const acceptFriendRequest = useCallback(async (requestId: string, fromUserId: string) => {
        if (!user || !userProfile) throw new Error('Not authenticated');

        const requestRef = doc(db, 'friendRequests', requestId);
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) throw new Error('Request not found');

        const requestData = requestSnap.data();

        await setDoc(doc(db, 'users', user.uid, 'friends', fromUserId), {
            addedAt: serverTimestamp(),
            displayName: requestData.fromUserName
        });

        await setDoc(doc(db, 'users', fromUserId, 'friends', user.uid), {
            addedAt: serverTimestamp(),
            displayName: userProfile.displayName
        });

        await deleteDoc(requestRef);

        // Update local state
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));

        // Refresh friends list
        await refreshFriends();
    }, [user, userProfile, refreshFriends]);

    const declineFriendRequest = useCallback(async (requestId: string) => {
        if (!user) throw new Error('Not authenticated');
        await deleteDoc(doc(db, 'friendRequests', requestId));
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    }, [user]);

    const cancelFriendRequest = useCallback(async (requestId: string) => {
        if (!user) throw new Error('Not authenticated');
        await deleteDoc(doc(db, 'friendRequests', requestId));
        setSentRequests(prev => prev.filter(r => r.id !== requestId));
    }, [user]);

    const removeFriend = useCallback(async (friendId: string) => {
        if (!user) throw new Error('Not authenticated');
        await deleteDoc(doc(db, 'users', user.uid, 'friends', friendId));
        await deleteDoc(doc(db, 'users', friendId, 'friends', user.uid));
        setFriends(prev => prev.filter(f => f.id !== friendId));
        friendsCache.delete(friendId);
    }, [user]);

    // ========== LISTEN ROOM ACTIONS ==========
    const createListenRoom = useCallback(async () => {
        if (!user || !userProfile) throw new Error('Not authenticated');
        if (!canUseListenTogether) throw new Error('Elite plan required');

        const roomId = generateSimpleCode();

        await setDoc(doc(db, 'listenRooms', roomId), {
            hostId: user.uid,
            hostName: userProfile.displayName || 'Host',
            hostPhoto: userProfile.photoURL || null,
            participants: [user.uid],
            participantDetails: {
                [user.uid]: {
                    displayName: userProfile.displayName || 'Host',
                    photoURL: userProfile.photoURL || null,
                    joinedAt: new Date()
                }
            },
            bannedUsers: [],
            currentSong: null,
            isPlaying: false,
            currentTime: 0,
            lastSyncAt: serverTimestamp(),
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'), {
            roomId,
            isHost: true
        });

        return roomId;
    }, [user, userProfile, canUseListenTogether]);

    const joinListenRoom = useCallback(async (inputCode: string, isAdminSecret: boolean = false) => {
        if (!user || !userProfile) throw new Error('Not authenticated');
        if (!canUseListenTogether) throw new Error('Elite plan required');

        const roomId = inputCode.trim().toUpperCase().replace(/[\s-]/g, '');

        if (roomId.length < 4 || roomId.length > 6) {
            throw new Error('Invalid room code');
        }

        const roomRef = doc(db, 'listenRooms', roomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) throw new Error('Room not found');

        const roomData = roomSnap.data();

        if (roomData.bannedUsers?.includes(user.uid)) {
            throw new Error('You have been banned from this room');
        }

        if (roomData.participants?.includes(user.uid)) {
            await setDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'), {
                roomId,
                isHost: roomData.hostId === user.uid,
                isAdminSecret
            });
            return;
        }

        if (!isAdminSecret) {
            await updateDoc(roomRef, {
                participants: arrayUnion(user.uid),
                [`participantDetails.${user.uid}`]: {
                    displayName: userProfile.displayName || 'User',
                    photoURL: userProfile.photoURL || null,
                    joinedAt: new Date()
                },
                lastSyncAt: serverTimestamp()
            });
        }

        await setDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'), {
            roomId,
            isHost: false,
            isAdminSecret
        });

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'roomInvites', roomId));
        } catch (e) { }
    }, [user, userProfile, canUseListenTogether]);

    const leaveListenRoom = useCallback(async () => {
        if (!user || !activeRoom) return;

        const roomRef = doc(db, 'listenRooms', activeRoom.id);

        if (activeRoom.hostId === user.uid) {
            await deleteDoc(roomRef);
            for (const participantId of activeRoom.participants) {
                try {
                    await deleteDoc(doc(db, 'users', participantId, 'activeRoom', 'current'));
                } catch (e) { }
            }
        } else {
            const updatedDetails = { ...activeRoom.participantDetails };
            delete updatedDetails[user.uid];

            await updateDoc(roomRef, {
                participants: arrayRemove(user.uid),
                participantDetails: updatedDetails
            });
        }

        await deleteDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'));
    }, [user, activeRoom]);

    const syncPlayback = useCallback(async (isPlaying: boolean, currentTime: number, song?: any) => {
        if (!user || !activeRoom) return;
        if (activeRoom.hostId !== user.uid) return;

        // Throttle sync to prevent quota exhaustion
        const now = Date.now();
        if (now - lastSyncRef.current < 3000) return; // Min 3 seconds between syncs
        lastSyncRef.current = now;

        const roomRef = doc(db, 'listenRooms', activeRoom.id);
        const updates: any = {
            isPlaying,
            currentTime,
            lastSyncAt: serverTimestamp()
        };

        if (song) {
            updates.currentSong = {
                id: song.id || song.songId,
                name: song.name || song.title,
                artist: song.artists?.primary?.[0]?.name || song.artist || 'Unknown',
                image: typeof song.image === 'string' ? song.image :
                    song.image?.[song.image.length - 1]?.url || '',
                audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[2]?.url || song.audioUrl || ''
            };
        }

        await updateDoc(roomRef, updates);
    }, [user, activeRoom]);

    const inviteFriendToRoom = useCallback(async (friendId: string) => {
        if (!user || !userProfile || !activeRoom) throw new Error('No active room');
        if (activeRoom.hostId !== user.uid) throw new Error('Only host can invite');

        await setDoc(doc(db, 'users', friendId, 'roomInvites', activeRoom.id), {
            hostId: user.uid,
            hostName: userProfile.displayName || 'Host',
            createdAt: serverTimestamp()
        });
    }, [user, userProfile, activeRoom]);

    const transferHost = useCallback(async (newHostId: string) => {
        if (!user || !activeRoom) throw new Error('No active room');
        if (activeRoom.hostId !== user.uid) throw new Error('Only host can transfer');

        const newHostDetails = activeRoom.participantDetails[newHostId];
        if (!newHostDetails) throw new Error('User not in room');

        const roomRef = doc(db, 'listenRooms', activeRoom.id);
        await updateDoc(roomRef, {
            hostId: newHostId,
            hostName: newHostDetails.displayName,
            hostPhoto: newHostDetails.photoURL
        });

        await updateDoc(doc(db, 'users', user.uid, 'activeRoom', 'current'), { isHost: false });
        await updateDoc(doc(db, 'users', newHostId, 'activeRoom', 'current'), { isHost: true });
    }, [user, activeRoom]);

    const removeListener = useCallback(async (userId: string) => {
        if (!user || !activeRoom) throw new Error('No active room');
        if (activeRoom.hostId !== user.uid) throw new Error('Only host can remove');
        if (userId === user.uid) throw new Error('Cannot remove yourself');

        const roomRef = doc(db, 'listenRooms', activeRoom.id);

        const updatedDetails = { ...activeRoom.participantDetails };
        delete updatedDetails[userId];

        await updateDoc(roomRef, {
            participants: arrayRemove(userId),
            participantDetails: updatedDetails
        });

        await deleteDoc(doc(db, 'users', userId, 'activeRoom', 'current'));
    }, [user, activeRoom]);

    const banListener = useCallback(async (userId: string) => {
        if (!user || !activeRoom) throw new Error('No active room');
        if (activeRoom.hostId !== user.uid) throw new Error('Only host can ban');
        if (userId === user.uid) throw new Error('Cannot ban yourself');

        const roomRef = doc(db, 'listenRooms', activeRoom.id);

        const updatedDetails = { ...activeRoom.participantDetails };
        delete updatedDetails[userId];

        await updateDoc(roomRef, {
            participants: arrayRemove(userId),
            participantDetails: updatedDetails,
            bannedUsers: arrayUnion(userId)
        });

        await deleteDoc(doc(db, 'users', userId, 'activeRoom', 'current'));
    }, [user, activeRoom]);

    // ========== HELPERS ==========
    const getFriendStatus = useCallback((userId: string): 'none' | 'pending_sent' | 'pending_received' | 'friends' => {
        if (friends.some(f => f.id === userId)) return 'friends';
        if (sentRequests.some(r => r.toUserId === userId)) return 'pending_sent';
        if (pendingRequests.some(r => r.fromUserId === userId)) return 'pending_received';
        return 'none';
    }, [friends, sentRequests, pendingRequests]);

    const getOnlineFriends = useCallback(() => {
        return friends.filter(f => f.isOnline && f.status !== 'invisible');
    }, [friends]);

    const value = useMemo(() => ({
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
        activeRoom,
        isInRoom,
        canUseListenTogether,
        createListenRoom,
        joinListenRoom,
        leaveListenRoom,
        syncPlayback,
        inviteFriendToRoom,
        transferHost,
        removeListener,
        banListener,
        roomInvites,
        getFriendStatus,
        getOnlineFriends,
        refreshFriends
    }), [
        friends, loadingFriends, pendingRequests, sentRequests, loadingRequests,
        sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, removeFriend,
        activeRoom, isInRoom, canUseListenTogether, createListenRoom, joinListenRoom, leaveListenRoom,
        syncPlayback, inviteFriendToRoom, transferHost, removeListener, banListener,
        roomInvites, getFriendStatus, getOnlineFriends, refreshFriends
    ]);

    return (
        <FriendsContext.Provider value={value}>
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) throw new Error("useFriends must be used within FriendsProvider");
    return context;
};

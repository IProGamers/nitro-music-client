"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase';
import { PLAYLIST_SONG_LIMITS, PLAY_HISTORY_LIMITS } from '@/lib/features';

export type SubscriptionTier = 'NITRO_CORE' | 'NITRO_ELITE' | 'NITRO_SUPREME';
export type UserStatus = 'online' | 'idle' | 'dnd' | 'invisible';

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    bannerURL: string | null;
    bio: string;
    tier: SubscriptionTier; // Vestigial — access is now binary (isApproved). Kept for back-compat.
    isAdmin: boolean;
    isApproved: boolean; // Binary access: admin-approved users get full access; everyone else is locked.
    arihantMode: boolean; // Simplified Jain Stavan UI mode
    status: UserStatus;
    lastActive: Date;
    // Username system
    username: string | null;
    usernameChangesLeft: number; // Starts at 2, decrements on each change
    pendingUsernameChange: string | null; // If awaiting admin approval
    createdAt: Date;
    updatedAt: Date;
}

export interface Playlist {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    ownerName: string;
    ownerPhoto: string | null;
    isPublic: boolean;
    isCollaborative: boolean;
    collaborators: string[]; // Array of user IDs
    songs: any[];
    coverImage?: string | null; // Custom playlist cover (falls back to first song art)
    createdAt: any;
    updatedAt: any;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
    saveToPlayHistory: (song: { id: string; name: string; artist: string; image: string; source?: string }) => Promise<void>;
    addLikedSong: (song: { id: string; name: string; artist: string; image: string }) => Promise<void>;
    removeLikedSong: (songId: string) => Promise<void>;
    isLikedSong: (songId: string) => Promise<boolean>;
    getLikedSongs: () => Promise<any[]>;
    // Playlist Functions
    createPlaylist: (name: string, description: string, isPublic: boolean) => Promise<string>;
    updatePlaylist: (playlistId: string, data: Partial<Playlist>) => Promise<void>;
    deletePlaylist: (playlistId: string) => Promise<void>;
    addSongToPlaylist: (playlistId: string, song: any) => Promise<void>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
    getUserPlaylists: () => Promise<Playlist[]>;
    getPlaylist: (playlistId: string) => Promise<Playlist | null>;
    getRecentPlays: (limitCount?: number) => Promise<any[]>;
    updateNowPlaying: (song: { id: string; name: string; artist: string; image: string } | null) => Promise<void>;
    // Collaborative Playlists
    addCollaborator: (playlistId: string, userId: string) => Promise<void>;
    removeCollaborator: (playlistId: string, userId: string) => Promise<void>;
    // Friend System
    searchUsersByName: (searchQuery: string) => Promise<{ uid: string; displayName: string; username: string | null; photoURL: string | null; status: UserStatus }[]>;
    updateUserStatus: (status: UserStatus) => Promise<void>;
    // Account notifications (deletion/plan changes)
    accountNotification: {
        type: 'deleted' | 'plan_upgraded' | 'plan_downgraded' | null;
        message: string;
        newTier?: SubscriptionTier;
    } | null;
    clearAccountNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if an error is a quota exceeded error (should be silenced)
const isQuotaError = (err: any): boolean => {
    return err?.code === 'resource-exhausted' ||
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('resource-exhausted');
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // In-memory cache for liked songs to avoid repeated Firestore reads
    const [likedSongsCache, setLikedSongsCache] = useState<Set<string>>(new Set());

    // Account notification state (for deletion/plan changes)
    const [accountNotification, setAccountNotification] = useState<{
        type: 'deleted' | 'plan_upgraded' | 'plan_downgraded' | null;
        message: string;
        newTier?: SubscriptionTier;
    } | null>(null);

    // Fetch or create user profile in Firestore
    const fetchOrCreateProfile = async (firebaseUser: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap;
        try {
            userSnap = await getDoc(userRef);
        } catch (err) {
            // Firestore read failed (permissions, network) — return a safe minimal profile
            // without writing anything, so we don't overwrite existing admin data
            console.warn('Firestore profile read failed, using minimal profile:', err);
            return {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Music Lover',
                photoURL: firebaseUser.photoURL,
                bannerURL: null,
                bio: '',
                tier: 'NITRO_CORE',
                isAdmin: false,
                isApproved: false,
                arihantMode: false,
                status: 'online',
                lastActive: new Date(),
                username: null,
                usernameChangesLeft: 2,
                pendingUsernameChange: null,
                createdAt: new Date(),
                updatedAt: new Date()
            } as UserProfile;
        }

        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Normalize access flags for legacy docs that predate the binary model.
            // Admins are always implicitly approved.
            return {
                ...data,
                isAdmin: data.isAdmin === true,
                isApproved: data.isAdmin === true || data.isApproved === true,
            } as UserProfile;
        } else {
            // Only create a new profile if the doc genuinely doesn't exist
            const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Music Lover',
                photoURL: firebaseUser.photoURL,
                bannerURL: null,
                bio: 'Music enthusiast & audiophile. Exploring the universe of sound one track at a time.',
                tier: 'NITRO_CORE',
                isAdmin: false,
                isApproved: false, // Locked by default — an admin must approve new users.
                arihantMode: false,
                status: 'online',
                lastActive: new Date(),
                username: null,
                usernameChangesLeft: 2,
                pendingUsernameChange: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            try {
                await setDoc(userRef, newProfile);
            } catch (err) {
                if (!isQuotaError(err)) console.warn('Could not create user profile doc:', err);
            }
            return newProfile;
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    const profile = await fetchOrCreateProfile(firebaseUser);
                    setUserProfile(profile);
                    // Clear any previous account notifications when a new user successfully signs in
                    setAccountNotification(null);
                } else {
                    setUser(null);
                    setUserProfile(null);
                }
            } catch (err) {
                if (!isQuotaError(err)) console.error('Auth state change error:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Preload liked songs cache when user logs in
    useEffect(() => {
        const loadLikedSongs = async () => {
            if (!user) {
                setLikedSongsCache(new Set());
                return;
            }
            try {
                const likesRef = collection(db, 'users', user.uid, 'likedSongs');
                const snap = await getDocs(likesRef);
                const ids = new Set(snap.docs.map(doc => doc.id));
                setLikedSongsCache(ids);
            } catch (err) {
                if (!isQuotaError(err)) console.error('Failed to preload liked songs:', err);
            }
        };
        loadLikedSongs();
    }, [user]);

    // Real-time listener for user document changes (deletion, plan changes)
    useEffect(() => {
        if (!user || loading) return;

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, async (snapshot) => {
            if (!snapshot.exists()) {
                // User document was deleted by admin!
                // Only show this if we had a profile (prevents race condition on new account creation)
                if (userProfile) {
                    setAccountNotification({
                        type: 'deleted',
                        message: 'Your account has been removed by an administrator. Please create a new account to continue.'
                    });
                    // Sign out the user
                    try {
                        await firebaseSignOut(auth);
                    } catch (e) {
                        console.error('Failed to sign out after account deletion:', e);
                    }
                }
                return;
            }

            const newData = snapshot.data() as UserProfile;

            // Check for plan changes
            if (userProfile && newData.tier !== userProfile.tier) {
                const oldTier = userProfile.tier;
                const newTier = newData.tier;

                // Determine if upgrade or downgrade
                const tierOrder = ['NITRO_CORE', 'NITRO_ELITE', 'NITRO_SUPREME'];
                const oldIndex = tierOrder.indexOf(oldTier);
                const newIndex = tierOrder.indexOf(newTier);

                if (newIndex > oldIndex) {
                    setAccountNotification({
                        type: 'plan_upgraded',
                        message: `Congratulations! You've been upgraded to ${formatTierName(newTier)}! 🎉`,
                        newTier
                    });
                } else if (newIndex < oldIndex) {
                    setAccountNotification({
                        type: 'plan_downgraded',
                        message: `Your plan has been changed to ${formatTierName(newTier)}.`,
                        newTier
                    });
                }
            }

            // Update local profile state
            setUserProfile(newData);
        }, (error: any) => {
            // Silently handle quota errors
            if (error?.code !== 'resource-exhausted') {
                console.error('Error listening to user document:', error);
            }
        });

        return () => unsubscribe();
    }, [user, loading, userProfile?.tier]);

    // Helper to format tier names nicely
    const formatTierName = (tier: SubscriptionTier): string => {
        switch (tier) {
            case 'NITRO_CORE': return 'Nitro Core';
            case 'NITRO_ELITE': return 'Nitro Elite';
            case 'NITRO_SUPREME': return 'Nitro Supreme';
            default: return tier;
        }
    };

    // Clear account notification
    // Clear account notification
    const clearAccountNotification = useCallback(() => {
        setAccountNotification(null);
    }, []);

    const formatAuthError = useCallback((error: any) => {
        const code = error?.code || '';
        switch (code) {
            case 'auth/user-not-found':
                return 'No account found with this email. Please sign up instead!';
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                // Firebase often returns invalid-credential for both "user not found" and "wrong password" 
                // for security (email enumeration protection).
                return 'Incorrect email or password. If you don\'t have an account, please Create One below!';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try signing in instead!';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return error.message || 'Authentication failed. Please try again.';
        }
    }, []);

    const isTempEmail = useCallback((email: string) => {
        const tempDomains = [
            'tempmail.com', '10minutemail.com', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'dispostable.com',
            'getnada.com', 'temp-mail.org', 'throwawaymail.com'
        ];
        const domain = email.split('@')[1]?.toLowerCase();
        return tempDomains.includes(domain);
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            const friendlyError = formatAuthError(err);
            setError(friendlyError);
            throw { ...err, message: friendlyError };
        }
    }, [formatAuthError]);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);

        if (isTempEmail(email)) {
            const tempError = 'Temporary/Disposable emails are not allowed for security reasons. Please use a real email.';
            setError(tempError);
            throw new Error(tempError);
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName });
        } catch (err: any) {
            const friendlyError = formatAuthError(err);
            setError(friendlyError);
            throw { ...err, message: friendlyError };
        }
    }, [isTempEmail, formatAuthError]);

    const signInWithGoogle = useCallback(async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            const friendlyError = formatAuthError(err);
            setError(friendlyError);
            throw { ...err, message: friendlyError };
        }
    }, [formatAuthError]);

    const signInWithGithub = useCallback(async () => {
        setError(null);
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (err: any) {
            const friendlyError = formatAuthError(err);
            setError(friendlyError);
            throw { ...err, message: friendlyError };
        }
    }, [formatAuthError]);

    const signOut = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
            throw err;
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
            throw err;
        }
    }, []);

    const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
        if (!user) throw new Error('Not authenticated');

        setError(null);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                ...data,
                updatedAt: new Date()
            });

            // Update local state
            setUserProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date() } : null);

            // Update Firebase Auth profile if name or photo changed
            if (data.displayName || data.photoURL) {
                await updateProfile(user, {
                    displayName: data.displayName || user.displayName,
                    photoURL: data.photoURL || user.photoURL
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
            throw err;
        }
    }, [user]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            const profile = await fetchOrCreateProfile(user);
            setUserProfile(profile);
        }
    }, [user]);

    // Save song to user's play history with tier-based limits
    // Elite: 50 max, Supreme: unlimited
    const saveToPlayHistory = useCallback(async (song: { id: string; name: string; artist: string; image: string; source?: string }) => {
        if (!user || !userProfile) return;

        try {
            // Use song.id as doc ID to prevent duplicates (upsert behavior)
            const songRef = doc(db, 'users', user.uid, 'playHistory', String(song.id));
            await setDoc(songRef, {
                songId: String(song.id),
                name: song.name,
                artist: song.artist,
                image: song.image,
                // Keep the source so a YouTube song's radio/suggestions stay on
                // YouTube (sending a YT id to the JioSaavn endpoint, or vice-versa, 500s).
                source: song.source === 'youtube' ? 'youtube' : 'jiosaavn',
                playedAt: new Date()
            });

            // Binary access model: unlimited play history for all approved users.
            const maxHistory = -1;

            // Only enforce limits if not unlimited (-1)
            if (maxHistory !== -1) {
                const historyRef = collection(db, 'users', user.uid, 'playHistory');
                const historyQuery = query(historyRef, orderBy('playedAt', 'desc'));
                const historySnap = await getDocs(historyQuery);

                // Delete entries beyond the limit
                if (historySnap.docs.length > maxHistory) {
                    const toDelete = historySnap.docs.slice(maxHistory);
                    for (const docSnap of toDelete) {
                        await deleteDoc(docSnap.ref);
                    }
                }
            }
        } catch (err: any) {
            // Silently ignore quota errors
            if (err?.code !== 'resource-exhausted') {
                console.error('Failed to save play history:', err);
            }
        }
    }, [user, userProfile]);

    // Add song to liked songs
    const addLikedSong = useCallback(async (song: { id: string; name: string; artist: string; image: string }) => {
        if (!user) return;

        // Optimistically update cache
        setLikedSongsCache(prev => new Set(prev).add(song.id));

        try {
            const likesRef = collection(db, 'users', user.uid, 'likedSongs');
            await setDoc(doc(likesRef, song.id), {
                songId: song.id,
                name: song.name,
                artist: song.artist,
                image: song.image,
                likedAt: new Date()
            });
        } catch (err) {
            // Rollback cache on error
            setLikedSongsCache(prev => {
                const next = new Set(prev);
                next.delete(song.id);
                return next;
            });
            if (!isQuotaError(err)) console.error('Failed to add liked song:', err);
        }
    }, [user]);

    // Remove song from liked songs
    const removeLikedSong = useCallback(async (songId: string) => {
        if (!user) return;

        // Optimistically update cache
        setLikedSongsCache(prev => {
            const next = new Set(prev);
            next.delete(songId);
            return next;
        });

        try {
            const songRef = doc(db, 'users', user.uid, 'likedSongs', songId);
            await deleteDoc(songRef);
        } catch (err) {
            // Rollback cache on error
            setLikedSongsCache(prev => new Set(prev).add(songId));
            if (!isQuotaError(err)) console.error('Failed to remove liked song:', err);
        }
    }, [user]);

    // Check if song is liked - Now uses cache for instant results
    const isLikedSong = useCallback(async (songId: string): Promise<boolean> => {
        if (!user) return false;
        // Use cache for instant check - no Firestore read needed
        return likedSongsCache.has(songId);
    }, [user, likedSongsCache]);

    // Playlist implementation
    const createPlaylist = useCallback(async (name: string, description: string, isPublic: boolean) => {
        if (!user) throw new Error('Not authenticated');
        const playlistRef = collection(db, 'playlists');
        const docRef = await addDoc(playlistRef, {
            name,
            description,
            ownerId: user.uid,
            ownerName: userProfile?.displayName || 'User',
            ownerPhoto: userProfile?.photoURL || null,
            isPublic,
            songs: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    }, [user, userProfile]);

    const updatePlaylist = useCallback(async (playlistId: string, data: Partial<Playlist>) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        await updateDoc(playlistRef, {
            ...data,
            updatedAt: new Date()
        });
    }, []);

    const deletePlaylist = useCallback(async (playlistId: string) => {
        await deleteDoc(doc(db, 'playlists', playlistId));
    }, []);

    // Add song to playlist with tier-based limits
    // Elite: 100 max songs, Supreme: unlimited
    const addSongToPlaylist = useCallback(async (playlistId: string, song: any) => {
        if (!userProfile) return;

        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentSongs = snap.data().songs || [];

            // Avoid duplicates
            if (currentSongs.find((s: any) => s.id === song.id)) return;

            // Binary access model: unlimited playlist size for all approved users.

            await updateDoc(playlistRef, {
                songs: [...currentSongs, song],
                updatedAt: new Date()
            });
        }
    }, [userProfile]);

    const removeSongFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentSongs = snap.data().songs || [];
            await updateDoc(playlistRef, {
                songs: currentSongs.filter((s: any) => s.id !== songId),
                updatedAt: new Date()
            });
        }
    }, []);

    const getUserPlaylists = useCallback(async (): Promise<Playlist[]> => {
        if (!user) return [];
        const q = query(collection(db, 'playlists'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
    }, [user]);

    const getPlaylist = useCallback(async (playlistId: string): Promise<Playlist | null> => {
        const snap = await getDoc(doc(db, 'playlists', playlistId));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Playlist;
        return null;
    }, []);

    const getLikedSongs = useCallback(async (): Promise<any[]> => {
        if (!user) return [];
        try {
            const likesRef = collection(db, 'users', user.uid, 'likedSongs');
            const snap = await getDocs(likesRef);
            const songs = snap.docs.map(d => {
                const data: any = d.data();
                return {
                    id: data.songId || d.id,
                    songId: data.songId || d.id,
                    name: data.name,
                    artist: data.artist,
                    image: data.image,
                    likedAt: data.likedAt?.toDate?.() || data.likedAt || null,
                };
            });
            // Newest liked first
            songs.sort((a, b) => (b.likedAt?.getTime?.() || 0) - (a.likedAt?.getTime?.() || 0));
            return songs;
        } catch (err) {
            if (!isQuotaError(err)) console.error('Failed to load liked songs:', err);
            return [];
        }
    }, [user]);

    const getRecentPlays = useCallback(async (limitCount = 20) => {
        if (!user) return [];
        const historyRef = collection(db, 'users', user.uid, 'playHistory');
        // Fetch more to handle duplicates
        const q = query(historyRef, orderBy('playedAt', 'desc'), limit(limitCount * 2));
        const snap = await getDocs(q);
        const rawHistory = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Deduplicate
        const uniqueHistoryMap = new Map();
        rawHistory.forEach((item: any) => {
            const key = item.songId || item.id;
            if (!uniqueHistoryMap.has(key)) {
                uniqueHistoryMap.set(key, item);
            }
        });

        return Array.from(uniqueHistoryMap.values()).slice(0, limitCount);
    }, [user]);

    // Update nowPlaying for friend activity
    const updateNowPlaying = useCallback(async (song: { id: string; name: string; artist: string; image: string } | null) => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                nowPlaying: song ? {
                    songId: song.id,
                    songName: song.name,
                    artistName: song.artist,
                    image: song.image,
                    startedAt: new Date()
                } : null
            });
        } catch (err) {
            if (!isQuotaError(err)) console.error('Failed to update nowPlaying:', err);
        }
    }, [user]);

    // Collaborative Playlist Functions
    const addCollaborator = useCallback(async (playlistId: string, userId: string) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentCollaborators = snap.data().collaborators || [];
            if (!currentCollaborators.includes(userId)) {
                await updateDoc(playlistRef, {
                    collaborators: [...currentCollaborators, userId],
                    isCollaborative: true,
                    updatedAt: new Date()
                });
            }
        }
    }, []);

    const removeCollaborator = useCallback(async (playlistId: string, userId: string) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentCollaborators = snap.data().collaborators || [];
            const newCollaborators = currentCollaborators.filter((id: string) => id !== userId);
            await updateDoc(playlistRef, {
                collaborators: newCollaborators,
                isCollaborative: newCollaborators.length > 0,
                updatedAt: new Date()
            });
        }
    }, []);

    // Search users by name or username
    const searchUsersByName = useCallback(async (searchQuery: string) => {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const results: { uid: string; displayName: string; username: string | null; photoURL: string | null; status: UserStatus }[] = [];

            const queryLower = searchQuery.toLowerCase();
            snapshot.forEach(doc => {
                const data = doc.data();
                const displayName = data.displayName || '';
                const username = data.username || '';

                // Case-insensitive partial match on name or username
                if ((displayName.toLowerCase().includes(queryLower) || username.toLowerCase().includes(queryLower)) && doc.id !== user?.uid) {
                    results.push({
                        uid: doc.id,
                        displayName: displayName,
                        username: username || null,
                        photoURL: data.photoURL || null,
                        status: data.status || 'offline'
                    });
                }
            });

            return results.slice(0, 10); // Limit to 10 results
        } catch (err) {
            if (!isQuotaError(err)) console.error('Failed to search users:', err);
            return [];
        }
    }, [user]);

    // Update user status (online/idle/dnd/invisible)
    const updateUserStatus = useCallback(async (status: UserStatus) => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                status: status,
                lastActive: new Date()
            });
        } catch (err) {
            if (!isQuotaError(err)) console.error('Failed to update status:', err);
        }
    }, [user]);

    const value = useMemo(() => ({
        user,
        userProfile,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        resetPassword,
        updateUserProfile,
        refreshProfile,
        saveToPlayHistory,
        addLikedSong,
        removeLikedSong,
        isLikedSong,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        getUserPlaylists,
        getPlaylist,
        getRecentPlays,
        getLikedSongs,
        updateNowPlaying,
        addCollaborator,
        removeCollaborator,
        searchUsersByName,
        updateUserStatus,
        accountNotification,
        clearAccountNotification
    }), [
        user,
        userProfile,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        resetPassword,
        updateUserProfile,
        refreshProfile,
        saveToPlayHistory,
        addLikedSong,
        removeLikedSong,
        isLikedSong,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        getUserPlaylists,
        getPlaylist,
        getRecentPlays,
        getLikedSongs,
        updateNowPlaying,
        addCollaborator,
        removeCollaborator,
        searchUsersByName,
        updateUserStatus,
        accountNotification,
        clearAccountNotification
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

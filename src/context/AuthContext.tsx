"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase';

export type SubscriptionTier = 'NITRO_CORE' | 'NITRO_ELITE' | 'NITRO_SUPREME';

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    bio: string;
    tier: SubscriptionTier;
    isAdmin: boolean;
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
    songs: any[];
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
    saveToPlayHistory: (song: { id: string; name: string; artist: string; image: string }) => Promise<void>;
    addLikedSong: (song: { id: string; name: string; artist: string; image: string }) => Promise<void>;
    removeLikedSong: (songId: string) => Promise<void>;
    isLikedSong: (songId: string) => Promise<boolean>;
    // Playlist Functions
    createPlaylist: (name: string, description: string, isPublic: boolean) => Promise<string>;
    updatePlaylist: (playlistId: string, data: Partial<Playlist>) => Promise<void>;
    deletePlaylist: (playlistId: string) => Promise<void>;
    addSongToPlaylist: (playlistId: string, song: any) => Promise<void>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
    getUserPlaylists: () => Promise<Playlist[]>;
    getPlaylist: (playlistId: string) => Promise<Playlist | null>;
    getRecentPlays: (limitCount?: number) => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch or create user profile in Firestore
    const fetchOrCreateProfile = async (firebaseUser: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        } else {
            // Create new profile
            const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Music Lover',
                photoURL: firebaseUser.photoURL,
                bio: 'Music enthusiast & audiophile. Exploring the universe of sound one track at a time.',
                tier: 'NITRO_CORE',
                isAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setDoc(userRef, newProfile);
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
                } else {
                    setUser(null);
                    setUserProfile(null);
                }
            } catch (err) {
                console.error('Auth state change error:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            throw err;
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName });
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
            throw err;
        }
    };

    const signInWithGoogle = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            throw err;
        }
    };

    const signInWithGithub = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with GitHub');
            throw err;
        }
    };

    const signOut = async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
            throw err;
        }
    };

    const resetPassword = async (email: string) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
            throw err;
        }
    };

    const updateUserProfile = async (data: Partial<UserProfile>) => {
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
    };

    const refreshProfile = async () => {
        if (user) {
            const profile = await fetchOrCreateProfile(user);
            setUserProfile(profile);
        }
    };

    // Save song to user's play history
    const saveToPlayHistory = async (song: { id: string; name: string; artist: string; image: string }) => {
        if (!user) return;

        try {
            const historyRef = collection(db, 'users', user.uid, 'playHistory');
            await addDoc(historyRef, {
                songId: song.id,
                name: song.name,
                artist: song.artist,
                image: song.image,
                playedAt: new Date()
            });
        } catch (err) {
            console.error('Failed to save play history:', err);
        }
    };

    // Add song to liked songs
    const addLikedSong = async (song: { id: string; name: string; artist: string; image: string }) => {
        if (!user) return;

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
            console.error('Failed to add liked song:', err);
        }
    };

    // Remove song from liked songs
    const removeLikedSong = async (songId: string) => {
        if (!user) return;

        try {
            const songRef = doc(db, 'users', user.uid, 'likedSongs', songId);
            await deleteDoc(songRef);
        } catch (err) {
            console.error('Failed to remove liked song:', err);
        }
    };

    // Check if song is liked
    const isLikedSong = async (songId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const songRef = doc(db, 'users', user.uid, 'likedSongs', songId);
            const songSnap = await getDoc(songRef);
            return songSnap.exists();
        } catch (err: any) {
            if (err.code === 'permission-denied') {
                console.error('🔥 [Firebase Permission Error]: Please update your Firestore Security Rules to allow subcollection access. See project root for firestore.rules');
            } else {
                console.error('Failed to check liked song:', err);
            }
            return false;
        }
    };

    // Playlist implementation
    const createPlaylist = async (name: string, description: string, isPublic: boolean) => {
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
    };

    const updatePlaylist = async (playlistId: string, data: Partial<Playlist>) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        await updateDoc(playlistRef, {
            ...data,
            updatedAt: new Date()
        });
    };

    const deletePlaylist = async (playlistId: string) => {
        await deleteDoc(doc(db, 'playlists', playlistId));
    };

    const addSongToPlaylist = async (playlistId: string, song: any) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentSongs = snap.data().songs || [];
            // Avoid duplicates
            if (currentSongs.find((s: any) => s.id === song.id)) return;

            await updateDoc(playlistRef, {
                songs: [...currentSongs, song],
                updatedAt: new Date()
            });
        }
    };

    const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
        const playlistRef = doc(db, 'playlists', playlistId);
        const snap = await getDoc(playlistRef);
        if (snap.exists()) {
            const currentSongs = snap.data().songs || [];
            await updateDoc(playlistRef, {
                songs: currentSongs.filter((s: any) => s.id !== songId),
                updatedAt: new Date()
            });
        }
    };

    const getUserPlaylists = async (): Promise<Playlist[]> => {
        if (!user) return [];
        const q = query(collection(db, 'playlists'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
    };

    const getPlaylist = async (playlistId: string): Promise<Playlist | null> => {
        const snap = await getDoc(doc(db, 'playlists', playlistId));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Playlist;
        return null;
    };

    const getRecentPlays = async (limitCount = 20) => {
        if (!user) return [];
        const historyRef = collection(db, 'users', user.uid, 'playHistory');
        const q = query(historyRef, orderBy('playedAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    return (
        <AuthContext.Provider value={{
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
            getRecentPlays
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

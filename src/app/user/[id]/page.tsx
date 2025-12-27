"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import {
    User, Music, Play, Heart, Clock, ArrowLeft, UserPlus, UserMinus,
    Globe, Lock, Loader2, ListMusic, Users
} from 'lucide-react';
import Link from 'next/link';
import FriendSearch from '@/components/FriendSearch';

interface PublicProfile {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    bio: string;
    tier: string;
    createdAt: any;
}

interface PublicPlaylist {
    id: string;
    name: string;
    description: string;
    songs: any[];
    isPublic: boolean;
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const { user, userProfile } = useAuth();
    const { playTrack } = usePlayer();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    // Tab state for Playlists/Friends
    const [activeTab, setActiveTab] = useState<'playlists' | 'friends'>('playlists');

    // Fetch user profile and playlists
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch user profile
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data() as PublicProfile;
                setProfile({ ...userData, uid: userId });

                // Fetch public playlists
                const playlistsRef = collection(db, 'playlists');
                const playlistsQuery = query(
                    playlistsRef,
                    where('ownerId', '==', userId),
                    where('isPublic', '==', true)
                );
                const playlistsSnap = await getDocs(playlistsQuery);
                const userPlaylists = playlistsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PublicPlaylist[];
                setPlaylists(userPlaylists);

                // Fetch follower/following counts
                const followersRef = collection(db, 'users', userId, 'followers');
                const followingRef = collection(db, 'users', userId, 'following');
                const [followersSnap, followingSnap] = await Promise.all([
                    getDocs(followersRef),
                    getDocs(followingRef)
                ]);
                setFollowerCount(followersSnap.size);
                setFollowingCount(followingSnap.size);

                // Check if current user follows this user
                if (user && user.uid !== userId) {
                    const followDoc = doc(db, 'users', userId, 'followers', user.uid);
                    const followSnap = await getDoc(followDoc);
                    setIsFollowing(followSnap.exists());
                }

            } catch (err: any) {
                console.error('Error fetching user data:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, user]);

    // Follow/Unfollow handler
    const handleFollowToggle = async () => {
        if (!user || user.uid === userId || followLoading) return;

        setFollowLoading(true);
        try {
            const followerRef = doc(db, 'users', userId, 'followers', user.uid);
            const followingRef = doc(db, 'users', user.uid, 'following', userId);

            if (isFollowing) {
                // Unfollow
                await Promise.all([
                    deleteDoc(followerRef),
                    deleteDoc(followingRef)
                ]);
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
            } else {
                // Follow
                const now = new Date();
                await Promise.all([
                    setDoc(followerRef, {
                        followerId: user.uid,
                        followerName: userProfile?.displayName || 'User',
                        followerPhoto: userProfile?.photoURL || null,
                        followedAt: now
                    }),
                    setDoc(followingRef, {
                        userId: userId,
                        userName: profile?.displayName || 'User',
                        userPhoto: profile?.photoURL || null,
                        followedAt: now
                    })
                ]);
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    // Check if viewing own profile
    const isOwnProfile = user?.uid === userId;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
                    <User size={40} className="text-zinc-600" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
                <p className="text-zinc-400 mb-8">This profile doesn't exist or is private.</p>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32">
            {/* Header Gradient */}
            <div className="h-48 md:h-64 bg-gradient-to-b from-cyan-900/50 to-transparent" />

            <div className="px-4 md:px-12 -mt-24 md:-mt-32 max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back</span>
                </button>

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[var(--card)] border-4 border-[var(--background)] shadow-2xl overflow-hidden shrink-0">
                        {profile.photoURL ? (
                            <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                <span className="text-4xl md:text-6xl font-bold text-white">
                                    {profile.displayName?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-xs uppercase tracking-widest text-[var(--foreground-muted)] font-bold mb-1">Profile</p>
                        <h1 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-2">
                            {profile.displayName || 'User'}
                        </h1>
                        {profile.bio && (
                            <p className="text-[var(--foreground-muted)] text-sm md:text-base mb-4 max-w-xl">
                                {profile.bio}
                            </p>
                        )}
                        <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-[var(--foreground-muted)]">
                            <span><strong className="text-[var(--foreground)]">{followerCount}</strong> Followers</span>
                            <span><strong className="text-[var(--foreground)]">{followingCount}</strong> Following</span>
                            <span><strong className="text-[var(--foreground)]">{playlists.length}</strong> Public Playlists</span>
                        </div>
                    </div>

                    {/* Follow Button */}
                    {!isOwnProfile && user && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${isFollowing
                                ? 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400'
                                : 'bg-cyan-400 text-black hover:bg-cyan-300'
                                }`}
                        >
                            {followLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : isFollowing ? (
                                <>
                                    <UserMinus size={16} />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Follow
                                </>
                            )}
                        </button>
                    )}

                    {isOwnProfile && (
                        <Link
                            href="/profile"
                            className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-full font-bold text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                        >
                            Edit Profile
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                <div className="mt-12">
                    <div className="flex gap-1 p-1 bg-[var(--card)] rounded-xl border border-[var(--border)] w-fit mb-6">
                        <button
                            onClick={() => setActiveTab('playlists')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'playlists'
                                ? 'bg-[var(--background)] text-cyan-400 shadow-sm'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            <ListMusic size={16} />
                            Playlists
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'friends'
                                ? 'bg-[var(--background)] text-cyan-400 shadow-sm'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            <Users size={16} />
                            Friends
                        </button>
                    </div>

                    {/* Playlists Tab Content */}
                    {activeTab === 'playlists' && (
                        <>
                            {playlists.length === 0 ? (
                                <div className="text-center py-16 bg-[var(--card)]/50 rounded-2xl border border-[var(--border)]">
                                    <Music size={40} className="text-[var(--foreground-muted)]/30 mx-auto mb-4" />
                                    <p className="text-[var(--foreground-muted)]">No public playlists yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                    {playlists.map(playlist => (
                                        <Link
                                            key={playlist.id}
                                            href={`/playlist/${playlist.id}`}
                                            className="group cursor-pointer"
                                        >
                                            <div className="aspect-square mb-3 overflow-hidden rounded-xl md:rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl group-hover:border-cyan-400/50 transition-all">
                                                {playlist.songs?.[0]?.image ? (
                                                    <img
                                                        src={playlist.songs[0].image}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                                                        <Music size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-cyan-400 transition-colors">
                                                {playlist.name}
                                            </h3>
                                            <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">
                                                {playlist.songs?.length || 0} tracks
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Friends Tab Content */}
                    {activeTab === 'friends' && (
                        <div className="bg-[var(--card)]/50 rounded-2xl border border-[var(--border)] p-6">
                            <FriendSearch />
                            <p className="text-[10px] text-[var(--foreground-muted)] text-center mt-6">
                                Search and follow users to see their activity and public playlists
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

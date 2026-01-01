"use client"
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { useSettings, SubscriptionTier } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useMusicData } from '@/context/MusicDataContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import {
    User, Heart, Clock, Settings, Edit2, Music, Play, Camera, Save, X,
    Check, Download, Zap, Monitor, Globe, Crown, Star, Lock, Sparkles,
    Headphones, Eye, Shield, LogOut, ListMusic, ImagePlus, Trophy, Users, Gift, FileText,
    Moon, Sun, Shuffle, DownloadCloud, Trash2, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useOffline } from '@/context/OfflineContext';
import UsernameChanger from '@/components/UsernameChanger';
import LiveStats from '@/components/LiveStats';
import WrappedModal from '@/components/WrappedModal';
import AchievementsPanel from '@/components/AchievementsPanel';
import LeaderboardsPanel from '@/components/LeaderboardsPanel';
import PlaylistImportExport from '@/components/PlaylistImportExport';
import ListeningRoom from '@/components/ListeningRoom';
import FriendSearch from '@/components/FriendSearch';
import AvatarPicker from '@/components/AvatarPicker';
import ProfileCustomization from '@/components/ProfileCustomization';
import { PREMIUM_PROFILE_FEATURES } from '@/lib/avatarLibrary';

// Tier configurations with unique badges
const TIER_CONFIG: Record<SubscriptionTier, {
    name: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    shadowColor: string;
    features: string[];
}> = {
    NITRO_CORE: {
        name: 'Nitro Core',
        tagline: 'Essential Experience',
        icon: <Star size={16} />,
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/10',
        borderColor: 'border-zinc-500/20',
        gradient: 'from-zinc-600 to-zinc-800',
        shadowColor: 'shadow-zinc-500/20',
        features: ['Standard Audio', 'Basic Streaming', 'Limited History']
    },
    NITRO_ELITE: {
        name: 'Nitro Elite',
        tagline: 'Premium Power',
        icon: <Zap size={16} />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        gradient: 'from-purple-600 to-indigo-600',
        shadowColor: 'shadow-purple-500/30',
        features: ['3D Spatial Audio', 'HD Quality', 'Full Visualizer', 'Extended History']
    },
    NITRO_SUPREME: {
        name: 'Nitro Supreme',
        tagline: 'Supreme Audiophile',
        icon: <Crown size={16} />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        gradient: 'from-amber-500 to-orange-600',
        shadowColor: 'shadow-amber-500/30',
        features: ['All Elite Features', 'Offline Downloads', 'Supreme HD Audio', 'Priority Support', 'Exclusive Content']
    }
};

// Feature access per tier (includes legacy NITRO_ULTRA fallback)
const TIER_FEATURES: Record<string, { audio3D: boolean; download: boolean; supremeQuality: boolean; visualizer: boolean }> = {
    NITRO_CORE: { audio3D: false, download: false, supremeQuality: false, visualizer: false },
    NITRO_ELITE: { audio3D: true, download: false, supremeQuality: false, visualizer: true },
    NITRO_SUPREME: { audio3D: true, download: true, supremeQuality: true, visualizer: true },
    // Legacy fallback for users with old tier value
    NITRO_ULTRA: { audio3D: true, download: true, supremeQuality: true, visualizer: true }
};

function ProfileContent() {
    const router = useRouter();
    const { playTrack, isSmartShuffle, toggleSmartShuffle, threeDMode, setThreeDMode } = usePlayer();
    const { theme, toggleTheme } = useTheme();
    const { user, userProfile, loading: authLoading, signOut, updateUserProfile } = useAuth();
    const {
        enableDownload, setEnableDownload,
        enable3DAudio, setEnable3DAudio,
        audioQuality, setAudioQuality,
        autoPlay, setAutoPlay,
        visualizer, setVisualizer,
        language: settingsLanguage,
        region, setRegion,
        tier, isAdmin
    } = useSettings();

    const { profileData, setProfileData, hasLoadedProfile, setHasLoadedProfile, clearProfileCache, clearSearchCache } = useMusicData();
    const { downloads, removeSong, storageUsed, storageLimit, clearAllDownloads } = useOffline();

    // Use cached data immediately for instant UI
    const [favorites, setFavorites] = useState<any[]>(profileData?.favorites || []);
    const [history, setHistory] = useState<any[]>(profileData?.history || []);
    const [playlists, setPlaylists] = useState<any[]>(profileData?.playlists || []);
    const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'playlists' | 'downloads' | 'plans' | 'settings'>('favorites');
    const searchParams = useSearchParams();
    // Never show loading if we have cached data
    const [loading, setLoading] = useState(!profileData && !hasLoadedProfile);

    // Deep link to tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['favorites', 'history', 'playlists', 'downloads', 'plans', 'settings'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        bio: '',
        photoURL: '',
        bannerURL: ''
    });
    const [saving, setSaving] = useState(false);

    // Premium Feature Modal States
    const [showWrapped, setShowWrapped] = useState(false);
    const [showImportExport, setShowImportExport] = useState(false);
    const [showListeningRoom, setShowListeningRoom] = useState(false);
    const [showFriendSheet, setShowFriendSheet] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [showProfileCustomization, setShowProfileCustomization] = useState(false);

    // Profile customization settings (loaded from userProfile or localStorage)
    const [profileCustomSettings, setProfileCustomSettings] = useState<{
        bannerGradient?: string;
        borderEffect?: string;
        badge?: string;
        avatarEffect?: string;
    }>({});

    // Load profile customization from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('nitro_profile_custom');
            if (saved) {
                setProfileCustomSettings(JSON.parse(saved));
            }
        } catch (e) {
            // Ignore
        }
    }, []);

    // Save profile customization settings
    const handleSaveCustomization = (settings: typeof profileCustomSettings) => {
        setProfileCustomSettings(settings);
        localStorage.setItem('nitro_profile_custom', JSON.stringify(settings));
    };

    // Handle legacy NITRO_ULTRA tier by mapping to NITRO_SUPREME config
    const effectiveTier = (tier as string) === 'NITRO_ULTRA' ? 'NITRO_SUPREME' : tier;
    const tierConfig = TIER_CONFIG[effectiveTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.NITRO_CORE;
    const features = TIER_FEATURES[tier as string] || TIER_FEATURES.NITRO_CORE;

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    // Initialize edit form when profile loads
    useEffect(() => {
        if (userProfile) {
            setEditForm({
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                photoURL: userProfile.photoURL || '',
                bannerURL: userProfile.bannerURL || ''
            });
        }
    }, [userProfile]);

    const { getUserPlaylists, getRecentPlays } = useAuth();

    // Fetch playlists, favorites and history
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Only show spinner if we have NO cached data at all
                if (!profileData) setLoading(true);

                // Use Firestore functions from AuthContext
                const [plist, recent] = await Promise.all([
                    getUserPlaylists(),
                    getRecentPlays(20)
                ]);

                // Fetch liked songs from Firestore (limit to 50 for performance)
                const likesRef = collection(db, 'users', user.uid, 'likedSongs');
                const likesSnap = await getDocs(query(likesRef, orderBy('likedAt', 'desc'), limit(50)));
                const userFavorites = likesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setPlaylists(plist);
                setHistory(recent);
                setFavorites(userFavorites);

                // Update global cache (persists to localStorage)
                setProfileData({
                    favorites: userFavorites,
                    history: recent,
                    playlists: plist,
                    lastFetchedAt: Date.now()
                });
                setHasLoadedProfile(true);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            // Always use cached data immediately, then refresh in background
            if (profileData) {
                setFavorites(profileData.favorites || []);
                setHistory(profileData.history || []);
                setPlaylists(profileData.playlists || []);
                setLoading(false);
            }

            // Background refresh if stale (5 minutes) or first load
            const fiveMinutes = 5 * 60 * 1000;
            const isStale = profileData && (Date.now() - profileData.lastFetchedAt > fiveMinutes);

            if (!hasLoadedProfile || isStale || !profileData) {
                fetchData();
            }
        }
    }, [user, hasLoadedProfile, getUserPlaylists, getRecentPlays]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateUserProfile({
                displayName: editForm.displayName,
                bio: editForm.bio,
                photoURL: editForm.photoURL || null,
                bannerURL: editForm.bannerURL || null
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };


    const handleSignOut = async () => {
        try {
            clearProfileCache(); // Clear cached profile data
            await signOut();
            router.push('/');
        } catch (e) {
            console.error(e);
        }
    };

    const isLoadingInitial = (authLoading && !user) || (loading && !profileData);

    if (isLoadingInitial) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 gap-4">
                <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full shadow-lg shadow-cyan-500/20"></div>
                <p className="text-zinc-500 font-medium animate-pulse">Syncing profile...</p>
            </div>
        );
    }

    if (!user || !userProfile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-950/40 to-[var(--background)] pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 px-4 md:px-12 pb-8 pt-6 md:pt-10 max-w-6xl mx-auto space-y-6 md:space-y-12">

                {/* Profile Header Card */}
                <div className="bg-[var(--card)]/50 backdrop-blur-2xl border border-[var(--border)] rounded-2xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    {/* Banner Image (if user has set one) */}
                    {(userProfile.bannerURL || editForm.bannerURL) && (
                        <div className="h-16 md:h-32 w-full relative">
                            <img
                                src={isEditing ? (editForm.bannerURL || userProfile.bannerURL || '') : (userProfile.bannerURL || '')}
                                className="w-full h-full object-cover"
                                alt="Profile Banner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent" />
                        </div>
                    )}

                    <div className={`p-3 md:p-12 ${(userProfile.bannerURL || editForm.bannerURL) ? 'pt-2 md:pt-0 md:-mt-12' : 'pt-4'}`}>
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-1.5 mb-1 md:mb-6">
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="p-2 md:p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-colors"
                                    title="Admin Panel"
                                >
                                    <Shield size={14} className="md:w-[18px] md:h-[18px]" />
                                </Link>
                            )}
                            <button
                                onClick={() => setShowFriendSheet(true)}
                                className="p-2 md:p-3 rounded-xl bg-[var(--card-hover)] hover:bg-cyan-400 hover:text-black border border-[var(--border)] text-[var(--foreground-muted)] transition-colors"
                                title="Friends"
                            >
                                <Users size={14} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="p-2 md:p-3 rounded-xl bg-[var(--card-hover)] hover:bg-cyan-400 hover:text-black border border-[var(--border)] text-[var(--foreground-muted)] transition-colors"
                                title="Settings"
                            >
                                <Settings size={14} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="p-2 md:p-3 rounded-xl bg-[var(--card-hover)] hover:bg-red-500/20 border border-[var(--border)] text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={14} className="md:w-[18px] md:h-[18px]" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                            {/* Avatar - Clickable to change */}
                            <div className="relative shrink-0">
                                {/* Get border effect class */}
                                {(() => {
                                    const borderEffect = profileCustomSettings.borderEffect
                                        ? PREMIUM_PROFILE_FEATURES.borderEffects.find(b => b.id === profileCustomSettings.borderEffect)?.class
                                        : '';
                                    const avatarEffect = profileCustomSettings.avatarEffect
                                        ? PREMIUM_PROFILE_FEATURES.avatarEffects.find(e => e.id === profileCustomSettings.avatarEffect)?.class
                                        : '';
                                    const badge = profileCustomSettings.badge
                                        ? PREMIUM_PROFILE_FEATURES.badges.find(b => b.id === profileCustomSettings.badge)
                                        : null;

                                    return (
                                        <>
                                            <div
                                                className={`w-14 h-14 md:w-36 md:h-36 rounded-full bg-[var(--card)] border-2 md:border-4 border-[var(--border)] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden group/avatar cursor-pointer ${borderEffect} ${avatarEffect}`}
                                                onClick={() => setShowAvatarPicker(true)}
                                            >
                                                {userProfile.photoURL ? (
                                                    <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="Avatar" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-2xl md:text-4xl font-bold text-white">
                                                            {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                                    <Camera size={16} className="text-white mb-0.5 md:w-5 md:h-5" />
                                                    <span className="text-[8px] md:text-[10px] uppercase font-bold text-white">Change</span>
                                                </div>
                                            </div>

                                            {/* Badge display - top right to avoid button interference */}
                                            {badge && (
                                                <div className={`absolute -top-1 -right-1 md:top-0 md:right-0 w-5 h-5 md:w-7 md:h-7 ${badge.color} rounded-full flex items-center justify-center text-xs md:text-sm shadow-lg z-30 border-2 border-[var(--background)]`}>
                                                    {badge.emoji}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Edit/Customize buttons */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 md:p-2 bg-cyan-400 rounded-full text-black hover:bg-cyan-300 transition-colors shadow-lg"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={10} className="md:w-3 md:h-3" />
                                        </button>
                                    )}
                                    {(tier === 'NITRO_ELITE' || tier === 'NITRO_SUPREME' || (tier as string) === 'NITRO_ULTRA') && (
                                        <button
                                            onClick={() => setShowProfileCustomization(true)}
                                            className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white hover:opacity-90 transition-opacity shadow-lg"
                                            title="Customize Profile"
                                        >
                                            <Sparkles size={10} className="md:w-3 md:h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left space-y-1.5 md:space-y-4">
                                {isEditing ? (
                                    <div className="space-y-3 max-w-md mx-auto md:mx-0">
                                        <input
                                            type="text"
                                            value={editForm.displayName}
                                            onChange={(e) => setEditForm(p => ({ ...p, displayName: e.target.value }))}
                                            placeholder="Display Name"
                                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xl font-bold focus:outline-none focus:border-cyan-400 transition-colors"
                                        />
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                            placeholder="Tell us about yourself..."
                                            rows={2}
                                            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground-muted)] text-sm focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                                        />

                                        {/* Avatar Selection */}
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAvatarPicker(true)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold text-sm hover:from-cyan-500/30 hover:to-purple-500/30 transition-all active:scale-[0.98]"
                                            >
                                                <User size={16} />
                                                Choose Avatar
                                            </button>
                                            {editForm.photoURL && (
                                                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                                    <Check size={12} className="text-green-400" />
                                                    <span className="truncate">Avatar selected</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ImagePlus size={14} className="text-purple-400 shrink-0" />
                                            <input
                                                type="text"
                                                value={editForm.bannerURL}
                                                onChange={(e) => setEditForm(p => ({ ...p, bannerURL: e.target.value }))}
                                                placeholder="Banner Image URL (optional)"
                                                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground-muted)] focus:outline-none focus:border-purple-400 transition-colors"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-5 py-2 bg-cyan-400 text-black rounded-full font-bold text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50"
                                            >
                                                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditForm({
                                                        displayName: userProfile.displayName || '',
                                                        bio: userProfile.bio || '',
                                                        photoURL: userProfile.photoURL || '',
                                                        bannerURL: userProfile.bannerURL || ''
                                                    });
                                                }}
                                                className="flex items-center gap-2 px-5 py-2 bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] rounded-full font-bold text-sm border border-[var(--border)] transition-colors"
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 justify-center md:justify-start">
                                                <h1 className="text-lg md:text-4xl font-bold text-[var(--foreground)]">
                                                    {userProfile.displayName || 'User'}
                                                </h1>
                                                {/* Dynamic Tier Badge */}
                                                <div className={`px-2.5 py-0.5 rounded-full ${tierConfig.bgColor} border ${tierConfig.borderColor} ${tierConfig.color} text-[9px] md:text-[10px] font-bold uppercase tracking-wide w-fit mx-auto md:mx-0 flex items-center gap-1`}>
                                                    {tierConfig.icon}
                                                    <span>{tierConfig.name}</span>
                                                </div>
                                            </div>
                                            {userProfile.bio && (
                                                <p className="text-[var(--foreground-muted)] text-xs md:text-base max-w-xl mx-auto md:mx-0 leading-relaxed">
                                                    {userProfile.bio}
                                                </p>
                                            )}
                                            <p className="text-[var(--foreground-muted)] text-[10px] md:text-sm">
                                                {user.email}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center md:justify-start gap-4 md:gap-8 pt-0.5">
                                            <div className="text-center md:text-left">
                                                <div className="text-lg md:text-3xl font-bold text-[var(--foreground)]">{favorites.length}</div>
                                                <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1 justify-center md:justify-start">
                                                    <Heart size={8} className="text-cyan-400" /> Favorites
                                                </div>
                                            </div>
                                            <div className="w-px h-6 bg-[var(--border)]"></div>
                                            <div className="text-center md:text-left">
                                                <div className="text-lg md:text-3xl font-bold text-[var(--foreground)]">{history.length}</div>
                                                <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1 justify-center md:justify-start">
                                                    <Play size={8} className="text-cyan-400" /> Played
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto no-scrollbar md:flex-wrap items-center justify-start gap-2 md:gap-4 -mx-1 px-1">
                    {[
                        { id: 'favorites', label: 'Liked', icon: Heart, mobileOnly: false },
                        { id: 'playlists', label: 'Playlists', icon: ListMusic, mobileOnly: false },
                        { id: 'downloads', label: 'Offline', icon: DownloadCloud, mobileOnly: false },
                        { id: 'history', label: 'Plays', icon: Clock, desktopOnly: false },
                        { id: 'plans', label: 'Plans', icon: Crown, mobileOnly: false },
                        { id: 'settings', label: 'More', icon: Settings, mobileOnly: false }
                    ].filter(tab => {
                        const isPC = typeof window !== 'undefined' && window.innerWidth >= 768;
                        if (tab.mobileOnly && isPC) return false;
                        if (tab.desktopOnly && !isPC) return false;
                        return true;
                    }).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 md:gap-3 px-3.5 md:px-8 py-2 md:py-4 rounded-xl md:rounded-3xl text-[9px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-[0.2em] transition-all border shrink-0 ${activeTab === tab.id ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-lg' : 'bg-[var(--card)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--foreground-muted)]/30 hover:text-[var(--foreground)]'}`}
                        >
                            <tab.icon size={12} className="md:w-4 md:h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Sections */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {activeTab === 'favorites' && (
                        <div className="space-y-8">
                            {favorites.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-[var(--card)]/50 rounded-2xl md:rounded-[3rem] border border-[var(--border)] mx-2 md:mx-0">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--card)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-[var(--border)]">
                                        <Heart size={24} className="text-[var(--foreground-muted)] md:w-8 md:h-8" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 px-4">Collection is empty</h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-xs md:text-base px-6">Your heart tracks will appear here once you like them.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
                                    {favorites.map((t: any) => (
                                        <div
                                            key={t.id}
                                            onClick={() => playTrack(t, favorites)}
                                            className="p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] group transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-3 md:gap-5 relative z-10">
                                                <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 shadow-xl">
                                                    <img src={t.image} className="w-full h-full rounded-xl object-cover" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-bold truncate text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors">{t.name}</h3>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tight mt-0.5">{t.artist}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            {history.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-[var(--card)]/50 rounded-2xl md:rounded-[3rem] border border-[var(--border)] mx-2 md:mx-0">
                                    <Clock size={40} className="text-[var(--foreground-muted)]/20 mx-auto mb-4 md:mb-6 md:w-12 md:h-12" />
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 px-4">Historical silence</h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-xs md:text-base px-6">Tracks you play will build your timeline here.</p>
                                </div>
                            ) : (
                                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6">
                                    {history.map((t: any) => (
                                        <div key={t.id} onClick={() => playTrack(t, history)} className="min-w-[160px] md:min-w-[200px] group cursor-pointer">
                                            <div className="relative aspect-square mb-3 md:mb-4 overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-xl md:shadow-2xl group-hover:border-cyan-400/50 transition-all duration-500">
                                                <img src={t.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play size={24} fill="white" className="text-white scale-125 transition-transform group-hover:scale-100 md:w-8 md:h-8" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold truncate text-xs md:text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{t.name}</h3>
                                            <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest mt-1 opacity-60">Played recently</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'playlists' && (
                        <div className="space-y-6">
                            {playlists.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-[var(--card)]/50 rounded-2xl md:rounded-[3rem] border border-[var(--border)] mx-2 md:mx-0">
                                    <ListMusic size={40} className="text-[var(--foreground-muted)]/20 mx-auto mb-4 md:mb-6 md:w-12 md:h-12" />
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 px-4">No playlists</h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-xs md:text-base px-6">Start building your musical journey.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 px-2 md:px-0">
                                    {playlists.map((p: any) => (
                                        <Link key={p.id} href={`/playlist/${p.id}`} className="group cursor-pointer">
                                            <div className="relative aspect-square mb-3 md:mb-4 overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-xl md:shadow-2xl group-hover:border-cyan-400/50 transition-all duration-500">
                                                {p.songs?.[0]?.image ? (
                                                    <img src={p.songs[0].image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]"><Music size={32} className="md:w-10 md:h-10" /></div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play size={24} fill="white" className="text-white scale-125 transition-transform group-hover:scale-100 md:w-8 md:h-8" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold truncate text-xs md:text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{p.name}</h3>
                                            <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest mt-1 opacity-60">{p.songs?.length || 0} Tracks</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'downloads' && (
                        <div className="space-y-6">
                            {/* Storage Info */}
                            <div className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border border-cyan-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                            <DownloadCloud size={20} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-[var(--foreground)]">Offline Storage</h3>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">
                                                {downloads.length} songs saved
                                            </p>
                                        </div>
                                    </div>
                                    {downloads.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Remove all downloaded songs?')) {
                                                    clearAllDownloads();
                                                }
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                {/* Storage Bar */}
                                <div className="w-full h-2 bg-[var(--card)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500"
                                        style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-[var(--foreground-muted)] mt-2 text-right">
                                    {(storageUsed / (1024 * 1024)).toFixed(1)} MB / {(storageLimit / (1024 * 1024)).toFixed(0)} MB
                                </p>
                            </div>

                            {downloads.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-[var(--card)]/50 rounded-2xl md:rounded-[3rem] border border-[var(--border)] mx-2 md:mx-0">
                                    <DownloadCloud size={40} className="text-[var(--foreground-muted)]/20 mx-auto mb-4 md:mb-6 md:w-12 md:h-12" />
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 px-4">No offline songs</h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-xs md:text-base px-6">Download songs to play them without internet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
                                    {downloads.map((song: any) => (
                                        <div
                                            key={song.id}
                                            onClick={() => playTrack(song, downloads)}
                                            className="p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] group transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-3 md:gap-5 relative z-10">
                                                <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 shadow-xl">
                                                    <img src={song.image} className="w-full h-full rounded-xl object-cover" />
                                                    <div className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full">
                                                        <Check size={8} className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-bold truncate text-sm text-[var(--foreground)] group-hover:text-cyan-400 transition-colors">{song.name}</h3>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tight mt-0.5">{song.artist}</p>
                                                    <p className="text-[9px] text-emerald-400 font-bold mt-1">
                                                        {(song.size / (1024 * 1024)).toFixed(1)} MB
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeSong(song.id);
                                                    }}
                                                    className="p-2 rounded-lg bg-[var(--card-hover)] hover:bg-red-500/20 text-[var(--foreground-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove download"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    {activeTab === 'downloads' && (
                        <div className="space-y-6">
                            {downloads.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-[var(--card)]/50 rounded-2xl md:rounded-[3rem] border border-[var(--border)] mx-2 md:mx-0">
                                    <DownloadCloud size={40} className="text-[var(--foreground-muted)]/20 mx-auto mb-4 md:mb-6 md:w-12 md:h-12" />
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 px-4">No downloads</h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-xs md:text-base px-6">Save songs for offline listening.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Storage Stats */}
                                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 md:p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                                                <Save size={18} className="text-cyan-400" /> Offline Storage
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete all downloads?')) clearAllDownloads();
                                                }}
                                                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
                                            >
                                                <Trash2 size={12} /> Clear All
                                            </button>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-400 transition-all duration-500"
                                                style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                                            <span>{(storageUsed / 1024 / 1024).toFixed(1)} MB Used</span>
                                            <span>{(storageLimit / 1024 / 1024).toFixed(0)} MB Limit</span>
                                        </div>
                                    </div>

                                    {/* Downloads Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 px-2 md:px-0">
                                        {downloads.map((t: any) => (
                                            <div key={t.id} onClick={() => playTrack(t, downloads)} className="min-w-[160px] md:min-w-[200px] group cursor-pointer">
                                                <div className="relative aspect-square mb-3 md:mb-4 overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-xl md:shadow-2xl group-hover:border-green-400/50 transition-all duration-500">
                                                    <img src={t.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute top-2 right-2 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                                        <Check size={8} strokeWidth={4} /> Saved
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Play size={24} fill="white" className="text-white scale-125 transition-transform group-hover:scale-100 md:w-8 md:h-8" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="overflow-hidden">
                                                        <h3 className="font-bold truncate text-xs md:text-sm text-[var(--foreground)] group-hover:text-green-400 transition-colors uppercase tracking-tight">{t.name}</h3>
                                                        <p className="text-[9px] md:text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest mt-1 opacity-60">{t.artist}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeSong(t.id); }}
                                                        className="text-[var(--foreground-muted)] hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'plans' && (
                        <div className="space-y-6 md:space-y-8">
                            {/* Current Plan Header - Compact on Mobile */}
                            <div className={`p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-gradient-to-r ${tierConfig.gradient} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 md:gap-5 mb-3 md:mb-4">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            {tierConfig.icon}
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-widest font-bold">Your Plan</p>
                                            <h2 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
                                                {tierConfig.name}
                                                <Sparkles size={18} className="text-white/80 md:w-6 md:h-6" />
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                        {tierConfig.features.slice(0, 3).map((f, i) => (
                                            <span key={i} className="px-2.5 py-1 md:px-3 md:py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-bold text-white">
                                                {f}
                                            </span>
                                        ))}
                                        {tierConfig.features.length > 3 && (
                                            <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/70">
                                                +{tierConfig.features.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* All Plans - Horizontal Scroll on Mobile */}
                            <div>
                                <h3 className="text-sm md:text-base font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-4 px-1">Choose Your Experience</h3>
                                <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                                    {(['NITRO_CORE', 'NITRO_ELITE', 'NITRO_SUPREME'] as SubscriptionTier[]).map((tierKey) => {
                                        const config = TIER_CONFIG[tierKey];
                                        const isActive = tier === tierKey || ((tier as string) === 'NITRO_ULTRA' && tierKey === 'NITRO_SUPREME');

                                        return (
                                            <div
                                                key={tierKey}
                                                className={`shrink-0 w-[260px] md:w-auto p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all relative overflow-hidden ${isActive
                                                    ? `bg-gradient-to-br ${config.gradient} border-transparent shadow-xl ${config.shadowColor}`
                                                    : `bg-[var(--card)] ${config.borderColor} hover:bg-[var(--card-hover)] active:scale-[0.98]`
                                                    }`}
                                            >
                                                {/* Popular Badge */}
                                                {tierKey === 'NITRO_ELITE' && !isActive && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-bl-xl">
                                                        Popular
                                                    </div>
                                                )}
                                                {tierKey === 'NITRO_SUPREME' && !isActive && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black text-[9px] font-bold uppercase tracking-wider rounded-bl-xl">
                                                        Best Value
                                                    </div>
                                                )}

                                                {/* Tier Header */}
                                                <div className="flex items-center gap-2.5 mb-3 md:mb-4">
                                                    <div className={`p-2.5 md:p-3 rounded-xl ${isActive ? 'bg-white/20' : config.bgColor}`}>
                                                        {config.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-base md:text-lg ${isActive ? 'text-white' : config.color}`}>
                                                            {config.name}
                                                        </h3>
                                                        <p className={`text-[10px] md:text-xs ${isActive ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>
                                                            {config.tagline}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Features List - Compact */}
                                                <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                                                    {config.features.slice(0, 4).map((f, i) => (
                                                        <div key={i} className={`flex items-center gap-2 text-xs md:text-sm ${isActive ? 'text-white' : 'text-[var(--foreground-muted)]/80'}`}>
                                                            <Check size={12} className={`shrink-0 ${isActive ? 'text-white' : config.color}`} />
                                                            <span className="truncate">{f}</span>
                                                        </div>
                                                    ))}
                                                    {config.features.length > 4 && (
                                                        <p className={`text-[10px] pl-5 ${isActive ? 'text-white/60' : 'text-[var(--foreground-muted)]/60'}`}>
                                                            +{config.features.length - 4} more features
                                                        </p>
                                                    )}
                                                </div>

                                                {/* CTA Button */}
                                                {isActive ? (
                                                    <div className="w-full py-2.5 md:py-3 bg-white/20 rounded-xl text-center text-white font-bold text-xs md:text-sm">
                                                        ✓ Current Plan
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href="/upgrade"
                                                        className={`block w-full py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all active:scale-95 text-center ${config.bgColor} ${config.color} hover:opacity-80`}
                                                    >
                                                        Upgrade Now
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Feature Comparison - Compact Grid */}
                            <div className="bg-[var(--card)]/50 rounded-2xl md:rounded-[2rem] p-4 md:p-8 border border-[var(--border)]">
                                <h3 className="text-sm md:text-xl font-bold text-[var(--foreground)] mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                                    <Eye size={16} className="text-cyan-400 md:w-5 md:h-5" /> Feature Access
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                                    {[
                                        { name: '3D Audio', icon: Headphones, available: features.audio3D, requiredTier: 'Elite' },
                                        { name: 'Downloads', icon: Download, available: features.download, requiredTier: 'Supreme' },
                                        { name: 'HD Quality', icon: Music, available: features.supremeQuality, requiredTier: 'Supreme' },
                                        { name: 'Visualizer', icon: Eye, available: features.visualizer, requiredTier: 'Elite' },
                                    ].map((feature, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${feature.available
                                                ? 'bg-cyan-500/10 border-cyan-500/20'
                                                : 'bg-[var(--card-hover)] border-[var(--border)] opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                                                <feature.icon size={16} className={`shrink-0 ${feature.available ? 'text-cyan-400' : 'text-[var(--foreground-muted)]'} md:w-5 md:h-5`} />
                                                <span className={`font-bold text-[11px] md:text-sm ${feature.available ? 'text-white' : 'text-[var(--foreground-muted)]'}`}>
                                                    {feature.name}
                                                </span>
                                            </div>
                                            {feature.available ? (
                                                <span className="text-[9px] md:text-xs text-cyan-400 font-bold flex items-center gap-1">
                                                    <Check size={10} className="md:w-3 md:h-3" /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="text-[9px] md:text-xs text-[var(--foreground-muted)] font-bold flex items-center gap-1">
                                                    <Lock size={10} className="md:w-3 md:h-3" /> {feature.requiredTier}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-20">

                            {/* Username Section (Full Width) */}
                            <div className="md:col-span-2">
                                <UsernameChanger />
                            </div>

                            {/* Column 1: Audio Engine (Visible First) */}
                            <div className="md:col-span-2 space-y-6 bg-[var(--card)]/30 p-5 md:p-8 rounded-[2rem] border border-[var(--border)] relative h-fit order-first">
                                {!features.audio3D && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                                        <Lock size={10} /> Requires Elite
                                    </div>
                                )}
                                <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                    <Headphones size={20} className="text-cyan-400" /> Audio Engine
                                </h2>

                                <div className="space-y-6">
                                    {/* 3D Audio Section */}
                                    <div className={`p-4 bg-[var(--card)] rounded-2xl border transition-all ${features.audio3D ? 'border-transparent hover:border-cyan-400/20' : 'border-amber-500/20 opacity-60'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                    3D Surround
                                                    {!features.audio3D && <Lock size={12} className="text-amber-400" />}
                                                </p>
                                                <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tighter mt-1">HRTF Spatial Audio</p>
                                            </div>
                                            <button
                                                onClick={() => features.audio3D && setEnable3DAudio(!enable3DAudio)}
                                                disabled={!features.audio3D}
                                                className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${!features.audio3D ? 'bg-[var(--card-hover)] cursor-not-allowed' : (enable3DAudio ? 'bg-cyan-400' : 'bg-[var(--card-hover)]')}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${enable3DAudio && features.audio3D ? 'translate-x-6 shadow-lg shadow-black/20' : ''}`} />
                                            </button>
                                        </div>

                                        {/* 3D Modes */}
                                        <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ${enable3DAudio && features.audio3D ? 'opacity-100 max-h-20' : 'opacity-30 pointer-events-none max-h-20'}`}>
                                            <button
                                                onClick={() => setThreeDMode('simple')}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${threeDMode === 'simple'
                                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground)]'}`}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                onClick={() => setThreeDMode('extreme')}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${threeDMode === 'extreme'
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground)]'}`}
                                            >
                                                Extreme
                                            </button>
                                        </div>
                                    </div>

                                    {/* Streaming Quality */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.2em] ml-2">Streaming Quality</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['low', 'medium', 'high', 'supreme'].map((q) => {
                                                const isSupreme = q === 'supreme';
                                                const canSelect = isSupreme ? features.supremeQuality : true;
                                                return (
                                                    <button
                                                        key={q}
                                                        onClick={() => canSelect && setAudioQuality(q as any)}
                                                        disabled={!canSelect}
                                                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all border relative ${audioQuality === q
                                                            ? 'bg-cyan-400 text-black border-cyan-400 shadow-lg shadow-cyan-400/20'
                                                            : canSelect
                                                                ? 'bg-[var(--card)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--foreground-muted)]/30'
                                                                : 'bg-[var(--card)] text-[var(--foreground-muted)] border-amber-500/20 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {q}
                                                        {!canSelect && <Lock size={8} className="absolute top-1 right-1 text-amber-400" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Visualizer */}
                                    <div className={`flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] ${!features.visualizer ? 'opacity-60' : ''}`}>
                                        <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                            Visualizer Effects
                                            {!features.visualizer && <Lock size={12} className="text-amber-400" />}
                                        </span>
                                        <button
                                            onClick={() => features.visualizer && setVisualizer(!visualizer)}
                                            disabled={!features.visualizer}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${!features.visualizer ? 'bg-[var(--card-hover)] cursor-not-allowed' : (visualizer ? 'bg-pink-500' : 'bg-[var(--card-hover)]')}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full transition-transform bg-white ${visualizer && features.visualizer ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Personalization & Experience */}
                            <div className="space-y-6">
                                {/* Personalization Section */}
                                <div className="space-y-6 bg-[var(--card)]/30 p-5 md:p-8 rounded-[2rem] border border-[var(--border)] h-fit">
                                    <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                        <Settings size={20} className="text-cyan-400" /> Personalization
                                    </h2>
                                    <div className="space-y-4">
                                        {/* Theme */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-[var(--foreground)]">Theme Mode</span>
                                                <span className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`w-14 h-8 rounded-full flex items-center px-1 transition-all border ${theme === 'dark' ? 'bg-black/50 border-cyan-500/30' : 'bg-zinc-200 border-zinc-300'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'translate-x-6 bg-cyan-400 text-black' : 'bg-white text-orange-500 shadow-sm'}`}>
                                                    {theme === 'dark' ? <Moon size={12} fill="currentColor" /> : <Sun size={12} fill="currentColor" />}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Region Selection */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                    <Globe size={14} className="text-cyan-400" /> Region
                                                </span>
                                                <span className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">Content Suggestion</span>
                                            </div>
                                            <select
                                                value={region}
                                                onChange={(e) => setRegion(e.target.value)}
                                                className="bg-[var(--background)] text-[var(--foreground)] text-xs font-bold border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-cyan-400"
                                            >
                                                <option value="Global">Global</option>
                                                <option value="India">India</option>
                                                <option value="USA">USA</option>
                                                <option value="UK">UK</option>
                                                <option value="Japan">Japan</option>
                                                <option value="South Korea">South Korea</option>
                                                <option value="Russia">Russia</option>
                                                <option value="Brazil">Brazil</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Settings */}
                                <div className="space-y-6 bg-[var(--card)]/30 p-5 md:p-8 rounded-[2rem] border border-[var(--border)] h-fit">
                                    <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                        <Monitor size={20} className="text-cyan-400" /> Experience
                                    </h2>

                                    <div className="space-y-3">
                                        {/* Smart Shuffle */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                            <div>
                                                <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                    AI Smart Shuffle <Sparkles size={12} className="text-purple-400" />
                                                </span>
                                                <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider block mt-0.5">Predictive Queue</span>
                                            </div>
                                            <button
                                                onClick={toggleSmartShuffle}
                                                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${isSmartShuffle ? 'bg-purple-500' : 'bg-[var(--card-hover)]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full transition-transform bg-white ${isSmartShuffle ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Auto Play */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                            <span className="font-bold text-sm text-[var(--foreground)]">Continuous Playback</span>
                                            <button
                                                onClick={() => setAutoPlay(!autoPlay)}
                                                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${autoPlay ? 'bg-cyan-500' : 'bg-[var(--card-hover)]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full transition-transform bg-white ${autoPlay ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Downloads */}
                                        <div className={`flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] ${!features.download ? 'opacity-60' : ''}`}>
                                            <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                Offline Downloads
                                                {!features.download && <Lock size={12} className="text-amber-400" />}
                                            </span>
                                            <button
                                                onClick={() => features.download && setEnableDownload(!enableDownload)}
                                                disabled={!features.download}
                                                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${!features.download ? 'bg-[var(--card-hover)] cursor-not-allowed' : (enableDownload ? 'bg-green-500' : 'bg-[var(--card-hover)]')}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full transition-transform bg-white ${enableDownload && features.download ? 'translate-x-5' : ''}`} />
                                            </button>
                                        </div>

                                        {/* PWA Install Instructions */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                    Install Nitro App <Smartphone size={14} className="text-cyan-400" />
                                                </span>
                                                <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider block mt-0.5">Add to Home Screen</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('nitro_show_pwa_prompt'));
                                                }}
                                                className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/20 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Show Steps
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Storage & Cache */}
                            <div className="space-y-6 bg-[var(--card)]/30 p-5 md:p-8 rounded-[2rem] border border-[var(--border)] h-fit">
                                <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                    <Save size={20} className="text-cyan-400" /> Storage & Cache
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-[var(--foreground)]">App Cache</span>
                                            <span className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">Reduce Lag & Free Space</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('Clear app cache? This will refresh the page.')) {
                                                    clearSearchCache();
                                                    clearProfileCache();
                                                    localStorage.removeItem('nitro_home_cache');
                                                    window.location.reload();
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Clear Cache
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Premium Feature Modals */}
            <WrappedModal isOpen={showWrapped} onClose={() => setShowWrapped(false)} />
            <PlaylistImportExport isOpen={showImportExport} onClose={() => setShowImportExport(false)} />
            <ListeningRoom isOpen={showListeningRoom} onClose={() => setShowListeningRoom(false)} />

            {/* Friend Search Bottom Sheet */}
            <AnimatePresence>
                {showFriendSheet && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowFriendSheet(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="relative w-full max-w-2xl mx-auto bg-[var(--background)] border-t border-[var(--border)] rounded-t-[2.5rem] shadow-2xl p-6 md:p-10 pt-4"
                        >
                            <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-6 md:mb-8 opacity-50" />
                            <FriendSearch onClose={() => setShowFriendSheet(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Avatar Picker Modal */}
            <AvatarPicker
                isOpen={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={(url) => {
                    setEditForm(p => ({ ...p, photoURL: url }));
                    setShowAvatarPicker(false);
                }}
                selectedAvatar={editForm.photoURL}
            />

            {/* Profile Customization Modal (Elite/Supreme) */}
            <ProfileCustomization
                isOpen={showProfileCustomization}
                onClose={() => setShowProfileCustomization(false)}
                currentSettings={profileCustomSettings}
                onSave={handleSaveCustomization}
            />
        </div >
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] overflow-hidden">
                <div className="w-full h-96 bg-gradient-to-b from-cyan-950/20 to-[var(--background)] animate-pulse" />
                <div className="max-w-6xl mx-auto px-4 md:px-12 pt-6 md:pt-10 relative z-10">
                    <div className="h-48 md:h-80 bg-[var(--card)]/50 rounded-[2.5rem] border border-[var(--border)] animate-pulse" />
                </div>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}

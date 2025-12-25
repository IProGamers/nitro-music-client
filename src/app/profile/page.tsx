"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { useSettings, SubscriptionTier } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import {
    User, Heart, Clock, Settings, Edit2, Music, Play, Camera, Save, X,
    Check, Download, Zap, Monitor, Globe, Crown, Star, Lock, Sparkles,
    Headphones, Eye, Shield, LogOut, ListMusic
} from 'lucide-react';
import Link from 'next/link';

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

export default function ProfilePage() {
    const router = useRouter();
    const { playTrack } = usePlayer();
    const { user, userProfile, loading: authLoading, signOut, updateUserProfile } = useAuth();
    const {
        enableDownload, setEnableDownload,
        enable3DAudio, setEnable3DAudio,
        audioQuality, setAudioQuality,
        autoPlay, setAutoPlay,
        visualizer, setVisualizer,
        language: settingsLanguage,
        tier, isAdmin
    } = useSettings();

    const [favorites, setFavorites] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'playlists' | 'plans' | 'settings'>('favorites');
    const [loading, setLoading] = useState(true);

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        bio: '',
        photoURL: ''
    });
    const [saving, setSaving] = useState(false);

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
                photoURL: userProfile.photoURL || ''
            });
        }
    }, [userProfile]);

    const { getUserPlaylists, getRecentPlays } = useAuth();

    // Fetch playlists, favorites and history
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Use Firestore functions from AuthContext
                const [plist, recent] = await Promise.all([
                    getUserPlaylists(),
                    getRecentPlays(20)
                ]);
                setPlaylists(plist);
                setHistory(recent);

                // Legacy API for favorites
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const fRes = await fetch(`${apiUrl}/api/favorites`);
                const fData = await fRes.json();
                if (fData.success) setFavorites(fData.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateUserProfile({
                displayName: editForm.displayName,
                bio: editForm.bio,
                photoURL: editForm.photoURL || null
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
            await signOut();
            router.push('/');
        } catch (e) {
            console.error(e);
        }
    };

    if (authLoading || loading) {
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

            <div className="relative z-10 p-4 md:p-12 pt-24 md:pt-12 max-w-6xl mx-auto space-y-6 md:space-y-12">

                {/* Profile Header Card */}
                <div className="bg-[var(--card)]/50 backdrop-blur-2xl border border-[var(--border)] rounded-2xl md:rounded-[2.5rem] p-4 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-1.5 mb-4 md:mb-6">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="p-2.5 md:p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-colors"
                                title="Admin Panel"
                            >
                                <Shield size={16} className="md:w-[18px] md:h-[18px]" />
                            </Link>
                        )}
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="p-2.5 md:p-3 rounded-xl bg-[var(--card-hover)] hover:bg-cyan-400 hover:text-black border border-[var(--border)] text-[var(--foreground-muted)] transition-colors"
                            title="Settings"
                        >
                            <Settings size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-2.5 md:p-3 rounded-xl bg-[var(--card-hover)] hover:bg-red-500/20 border border-[var(--border)] text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-[var(--card)] border-4 border-[var(--border)] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden group/avatar">
                                {userProfile.photoURL ? (
                                    <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-3xl md:text-4xl font-bold text-white">
                                            {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                        <Camera size={20} className="text-white mb-1" />
                                        <span className="text-[10px] uppercase font-bold">Upload</span>
                                    </div>
                                )}
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute bottom-0 right-0 p-2.5 bg-cyan-400 rounded-full text-black hover:bg-cyan-300 transition-colors shadow-lg z-20"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
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
                                    <input
                                        type="text"
                                        value={editForm.photoURL}
                                        onChange={(e) => setEditForm(p => ({ ...p, photoURL: e.target.value }))}
                                        placeholder="Profile Image URL"
                                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400 transition-colors"
                                    />
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
                                                    photoURL: userProfile.photoURL || ''
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
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
                                            <h1 className="text-xl md:text-4xl font-bold text-[var(--foreground)]">
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

                                    <div className="flex items-center justify-center md:justify-start gap-4 md:gap-8 pt-1">
                                        <div className="text-center md:text-left">
                                            <div className="text-lg md:text-3xl font-bold text-[var(--foreground)]">{favorites.length}</div>
                                            <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1">
                                                <Heart size={8} className="text-cyan-400" /> Favorites
                                            </div>
                                        </div>
                                        <div className="w-px h-6 bg-[var(--border)]"></div>
                                        <div className="text-center md:text-left">
                                            <div className="text-lg md:text-3xl font-bold text-[var(--foreground)]">{history.length}</div>
                                            <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1">
                                                <Play size={8} className="text-cyan-400" /> Played
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto no-scrollbar md:flex-wrap items-center justify-start gap-2 md:gap-4 -mx-1 px-1">
                    {[
                        { id: 'favorites', label: 'Liked', icon: Heart, mobileOnly: false },
                        { id: 'playlists', label: 'Playlists', icon: ListMusic, mobileOnly: false },
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

                    {/* PLANS TAB */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Audio Section */}
                            <div className="space-y-6 bg-[var(--card)]/30 p-8 rounded-[2.5rem] border border-[var(--border)] relative">
                                {!features.audio3D && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                                        <Lock size={10} /> Requires Elite
                                    </div>
                                )}
                                <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                    <Headphones size={20} className="text-cyan-400" /> Audio Engine
                                </h2>

                                <div className="space-y-6">
                                    <div className={`flex items-center justify-between p-4 bg-[var(--card)] rounded-2xl border transition-all ${features.audio3D ? 'border-transparent hover:border-cyan-400/20' : 'border-amber-500/20 opacity-60'}`}>
                                        <div>
                                            <p className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                                3D Surround Effect
                                                {!features.audio3D && <Lock size={12} className="text-amber-400" />}
                                            </p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tighter mt-1">HRTF Spatial Audio</p>
                                        </div>
                                        <button
                                            onClick={() => features.audio3D && setEnable3DAudio(!enable3DAudio)}
                                            disabled={!features.audio3D}
                                            className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${!features.audio3D ? 'bg-[var(--card-hover)] cursor-not-allowed' : (enable3DAudio ? 'bg-cyan-400' : 'bg-[var(--card-hover)]')
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${enable3DAudio && features.audio3D ? 'translate-x-6 shadow-lg shadow-black/20' : ''}`} />
                                        </button>
                                    </div>

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
                                </div>
                            </div>

                            {/* App Preferences */}
                            <div className="space-y-6 bg-[var(--card)]/30 p-8 rounded-[2.5rem] border border-[var(--border)]">
                                <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-4">
                                    <Monitor size={20} className="text-cyan-400" /> Experience
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                        <span className="font-bold text-sm text-[var(--foreground)]">Continuous Playback</span>
                                        <button
                                            onClick={() => setAutoPlay(!autoPlay)}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${autoPlay ? 'bg-white' : 'bg-[var(--card-hover)]'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full transition-transform ${autoPlay ? 'translate-x-5 bg-black' : 'bg-[var(--foreground-muted)]'}`} />
                                        </button>
                                    </div>
                                    <div className={`flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] ${!features.download ? 'opacity-60' : ''}`}>
                                        <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                            Offline Downloads
                                            {!features.download && <Lock size={12} className="text-amber-400" />}
                                        </span>
                                        <button
                                            onClick={() => features.download && setEnableDownload(!enableDownload)}
                                            disabled={!features.download}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${!features.download ? 'bg-[var(--card-hover)] cursor-not-allowed' : (enableDownload ? 'bg-white' : 'bg-[var(--card-hover)]')
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full transition-transform ${enableDownload && features.download ? 'translate-x-5 bg-black' : 'bg-[var(--foreground-muted)]'}`} />
                                        </button>
                                    </div>
                                    <div className={`flex items-center justify-between p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] ${!features.visualizer ? 'opacity-60' : ''}`}>
                                        <span className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                            Visualizer Effects
                                            {!features.visualizer && <Lock size={12} className="text-amber-400" />}
                                        </span>
                                        <button
                                            onClick={() => features.visualizer && setVisualizer(!visualizer)}
                                            disabled={!features.visualizer}
                                            className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${!features.visualizer ? 'bg-[var(--card-hover)] cursor-not-allowed' : (visualizer ? 'bg-white' : 'bg-[var(--card-hover)]')
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full transition-transform ${visualizer && features.visualizer ? 'translate-x-5 bg-black' : 'bg-[var(--foreground-muted)]'}`} />
                                        </button>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-[var(--border)] text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                                        <div className="flex items-center gap-2">
                                            <Globe size={12} /> Region: {settingsLanguage}
                                        </div>
                                        <div className="text-cyan-400 cursor-pointer hover:underline">Change</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div >
    )
}

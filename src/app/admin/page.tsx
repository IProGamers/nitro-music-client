"use client"
import { useState, useEffect } from 'react';
import { useSettings, SubscriptionTier } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Shield, Crown, Zap, Star, Users, Settings,
    Check, X, Loader2, ChevronRight, Lock,
    Sparkles, ArrowLeft, Search, UserCheck, UserX,
    BarChart3, TrendingUp, Music, RefreshCw, Trash2,
    AlertTriangle, Eye, Mail, Heart, Clock, ChevronDown, ChevronUp, ShieldAlert,
    ListMusic, Globe, LockIcon
} from 'lucide-react';
import Link from 'next/link';
import UsernameRequestsAdmin from '@/components/UsernameRequestsAdmin';

const TIER_INFO: Record<string, { name: string; icon: React.ReactNode; color: string; bgColor: string; gradient: string }> = {
    NITRO_CORE: { name: 'Nitro Core', icon: <Star size={16} />, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', gradient: 'from-zinc-600 to-zinc-800' },
    NITRO_ELITE: { name: 'Nitro Elite', icon: <Zap size={16} />, color: 'text-purple-400', bgColor: 'bg-purple-500/20', gradient: 'from-purple-600 to-indigo-600' },
    NITRO_SUPREME: { name: 'Nitro Supreme', icon: <Crown size={16} />, color: 'text-amber-400', bgColor: 'bg-amber-500/20', gradient: 'from-amber-500 to-orange-600' },
    // Legacy fallback for users with old tier value
    NITRO_ULTRA: { name: 'Nitro Supreme', icon: <Crown size={16} />, color: 'text-amber-400', bgColor: 'bg-amber-500/20', gradient: 'from-amber-500 to-orange-600' },
};

interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    tier: SubscriptionTier;
    isAdmin: boolean;
    createdAt: any;
    updatedAt: any;
}

interface PlaylistData {
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

// Funny random security questions - answer is always "Veer"
const SECURITY_QUESTIONS = [
    "How many legs does a fish have?",
    "What color is a mirror?",
    "How many months have 28 days?",
    "What is the capital of Mars?",
    "If a tree falls in the forest and no one is around, does it make a sound?",
    "Why did the chicken cross the road?",
    "How many teeth does a chicken have?",
    "What happens if you throw a red stone into the blue sea?",
    "What has keys but no locks, space but no room, and allows you to enter but never leave?",
    "How many stars are in the sky right now? (Enter name of creator to skip counting)"
];

export default function AdminPage() {
    const router = useRouter();
    const { isAdmin } = useSettings();
    const { user, userProfile, loading: authLoading, refreshProfile: authRefresh } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'playlists' | 'settings'>('overview');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Security question modal state
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [pendingAdminAction, setPendingAdminAction] = useState<{ userId: string; currentStatus: boolean } | null>(null);
    const [pendingDeleteAction, setPendingDeleteAction] = useState<{ userId: string; userName: string } | null>(null);
    const [securityError, setSecurityError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Playlists state
    const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(true);
    const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
    const [pendingPlaylistDelete, setPendingPlaylistDelete] = useState<{ playlistId: string; playlistName: string } | null>(null);
    const [showPlaylistDeleteModal, setShowPlaylistDeleteModal] = useState(false);

    // User details expansion state
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<{ [key: string]: { likedSongs: any[], playlists: any[], playHistory: any[] } }>({});
    const [loadingUserDetails, setLoadingUserDetails] = useState<string | null>(null);

    // Fetch all users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        setError(null);
        try {
            const usersRef = collection(db, 'users');
            // Try without ordering first (simpler query, less likely to need index)
            const snapshot = await getDocs(usersRef);
            const userData = snapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id
            })) as UserData[];
            // Sort client-side instead
            userData.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            setUsers(userData);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            // Show more detailed error message
            if (err.code === 'permission-denied') {
                setError('Permission denied. Please update Firestore security rules to allow reading users collection.');
            } else {
                setError(`Failed to fetch users: ${err.message || err.code || 'Unknown error'}`);
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    // Fetch all playlists
    const fetchPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            const playlistsRef = collection(db, 'playlists');
            // Try with sorting first
            try {
                const q = query(playlistsRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const playlistData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PlaylistData[];
                setPlaylists(playlistData);
            } catch (e: any) {
                // Fallback if index is missing
                if (e.code === 'failed-precondition' || e.message.includes('index')) {
                    const snapshot = await getDocs(playlistsRef);
                    const playlistData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as PlaylistData[];
                    setPlaylists(playlistData);
                } else {
                    throw e;
                }
            }
        } catch (err: any) {
            console.error('Error fetching playlists:', err);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    // Filtered playlists
    const filteredPlaylists = playlists.filter(p =>
        p.name?.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(playlistSearchQuery.toLowerCase())
    );

    // Request playlist deletion
    const requestPlaylistDeletion = (playlistId: string, playlistName: string) => {
        setPendingPlaylistDelete({ playlistId, playlistName });
        setShowPlaylistDeleteModal(true);
    };

    // Confirm Playlist Deletion
    const confirmDeletePlaylist = async () => {
        if (!pendingPlaylistDelete) return;

        const { playlistId } = pendingPlaylistDelete;
        setUpdating(playlistId);

        try {
            await deleteDoc(doc(db, 'playlists', playlistId));
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            setSuccess('Playlist deleted successfully');
        } catch (err: any) {
            setError('Failed to delete playlist');
        } finally {
            setUpdating(null);
            setShowPlaylistDeleteModal(false);
            setPendingPlaylistDelete(null);
        }
    };

    // Admin functions moved below


    useEffect(() => {
        if (user && isAdmin) {
            fetchUsers();
            fetchPlaylists();
        }
    }, [user, isAdmin]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    // Update user tier
    const updateUserTier = async (userId: string, newTier: SubscriptionTier) => {
        setUpdating(userId);
        setSuccess(null);
        setError(null);

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                tier: newTier,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(prev => prev.map(u =>
                u.uid === userId ? { ...u, tier: newTier } : u
            ));

            // If updating own profile, refresh
            if (userId === user?.uid) {
                await authRefresh();
            }

            setSuccess(`Updated user to ${TIER_INFO[newTier].name}`);
        } catch (err: any) {
            setError('Failed to update tier');
        } finally {
            setUpdating(null);
        }
    };

    // Request admin toggle (shows security question first)
    const requestAdminToggle = (userId: string, currentStatus: boolean) => {
        if (userId === user?.uid) {
            setError("You can't modify your own admin access");
            return;
        }

        // Pick a random security question
        const randomQuestion = SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)];
        setSecurityQuestion(randomQuestion);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingAdminAction({ userId, currentStatus });
        setShowSecurityModal(true);
    };

    // Verify security answer and execute admin toggle
    const verifyAndToggleAdmin = async () => {
        // Check if answer is "Veer" (case insensitive)
        if (securityAnswer.trim().toLowerCase() !== 'veer') {
            setSecurityError('Incorrect answer. Access denied.');
            return;
        }

        if (!pendingAdminAction) return;

        setShowSecurityModal(false);
        setSecurityAnswer('');
        setSecurityError(null);

        // Proceed with admin toggle
        const { userId, currentStatus } = pendingAdminAction;
        setPendingAdminAction(null);

        setUpdating(userId);
        setSuccess(null);
        setError(null);

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                isAdmin: !currentStatus,
                updatedAt: new Date()
            });

            setUsers(prev => prev.map(u =>
                u.uid === userId ? { ...u, isAdmin: !currentStatus } : u
            ));

            setSuccess(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
        } catch (err: any) {
            setError('Failed to update admin status');
        } finally {
            setUpdating(null);
        }
    };

    // Cancel security modal
    const cancelSecurityModal = () => {
        setShowSecurityModal(false);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingAdminAction(null);
    };

    // Request user deletion (shows security question first)
    const requestUserDeletion = (userId: string, userName: string) => {
        if (userId === user?.uid) {
            setError("You can't delete your own account from the admin panel");
            return;
        }

        // Pick a random security question
        const randomQuestion = SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)];
        setSecurityQuestion(randomQuestion);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingDeleteAction({ userId, userName });
        setShowDeleteModal(true);
    };

    // Verify security answer and execute user deletion
    const verifyAndDeleteUser = async () => {
        // Check if answer is "Veer" (case insensitive)
        if (securityAnswer.trim().toLowerCase() !== 'veer') {
            setSecurityError('Incorrect answer. Access denied.');
            return;
        }

        if (!pendingDeleteAction) return;

        setShowDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);

        // Proceed with deletion
        const { userId } = pendingDeleteAction;
        setPendingDeleteAction(null);

        setUpdating(userId);
        setSuccess(null);
        setError(null);

        try {
            // Delete user's Firestore profile and all subcollections
            const userRef = doc(db, 'users', userId);

            // Delete subcollections (playHistory, likedSongs)
            const playHistoryRef = collection(db, 'users', userId, 'playHistory');
            const likedSongsRef = collection(db, 'users', userId, 'likedSongs');

            const [historySnap, likedSnap] = await Promise.all([
                getDocs(playHistoryRef),
                getDocs(likedSongsRef)
            ]);

            // Delete all documents in subcollections
            const deletions = [
                ...historySnap.docs.map(doc => deleteDoc(doc.ref)),
                ...likedSnap.docs.map(doc => deleteDoc(doc.ref))
            ];

            await Promise.all(deletions);

            // Delete user's playlists
            const playlistsQuery = query(collection(db, 'playlists'), where('ownerId', '==', userId));
            const playlistsSnap = await getDocs(playlistsQuery);
            await Promise.all(playlistsSnap.docs.map(doc => deleteDoc(doc.ref)));

            // Finally, delete the user document
            await deleteDoc(userRef);

            // Update local state
            setUsers(prev => prev.filter(u => u.uid !== userId));

            setSuccess('User and all associated data deleted successfully');
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(`Failed to delete user: ${err.message || 'Unknown error'}`);
        } finally {
            setUpdating(null);
        }
    };

    // Cancel delete modal
    const cancelDeleteModal = () => {
        setShowDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingDeleteAction(null);
    };

    // Fetch user details (liked songs, playlists, history)
    const fetchUserDetails = async (userId: string) => {
        if (userDetails[userId] || loadingUserDetails === userId) return;

        setLoadingUserDetails(userId);
        try {
            // Fetch liked songs
            const likedSongsRef = collection(db, 'users', userId, 'likedSongs');
            const likedSnap = await getDocs(likedSongsRef);
            const likedSongs = likedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch user's playlists
            const playlistsQuery = query(collection(db, 'playlists'), where('ownerId', '==', userId));
            const playlistsSnap = await getDocs(playlistsQuery);
            const userPlaylists = playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch play history
            const historyRef = collection(db, 'users', userId, 'playHistory');
            const historyQuery = query(historyRef, orderBy('playedAt', 'desc'), limit(10));
            const historySnap = await getDocs(historyQuery);
            const playHistory = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setUserDetails(prev => ({
                ...prev,
                [userId]: { likedSongs, playlists: userPlaylists, playHistory }
            }));
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setLoadingUserDetails(null);
        }
    };

    // Toggle user expansion
    const toggleUserExpansion = (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
            fetchUserDetails(userId);
        }
    };

    // Stats calculation
    const stats = {
        totalUsers: users.length,
        coreUsers: users.filter(u => u.tier === 'NITRO_CORE').length,
        eliteUsers: users.filter(u => u.tier === 'NITRO_ELITE').length,
        supremeUsers: users.filter(u => u.tier === 'NITRO_SUPREME').length,
        adminUsers: users.filter(u => u.isAdmin).length,
        totalPlaylists: playlists.length,
        publicPlaylists: playlists.filter(p => p.isPublic).length,
        privatePlaylists: playlists.filter(p => !p.isPublic).length,
    };

    // Filtered users
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    // Access denied screen
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <Lock size={40} className="text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
                    <p className="text-zinc-400 mb-8">
                        You don't have permission to access the admin panel.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32">
            <div className="bg-gradient-to-b from-amber-500/10 to-[var(--background)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto p-4 md:p-8 pt-4 md:pt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/20">
                                <Shield size={22} className="text-white md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-[var(--foreground)]">Admin Panel</h1>
                                <p className="text-[var(--foreground-muted)] text-[10px] md:text-sm">Manage users and subscriptions</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loadingUsers}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--card)] hover:bg-[var(--card-hover)] rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors text-xs"
                        >
                            <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1.5 md:gap-2 mt-6 md:mt-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'settings', label: 'My Tier', icon: Settings },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-medium text-[11px] md:text-sm transition-all shrink-0 ${activeTab === tab.id
                                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                                    : 'bg-[var(--card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                                    }`}
                            >
                                <tab.icon size={14} className="md:w-4 md:h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            <div className="max-w-7xl mx-auto p-6 md:p-8 pt-4">
                {success && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                        <Check size={20} className="text-green-400" />
                        <span className="text-green-300">{success}</span>
                        <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                        <AlertTriangle size={20} className="text-red-400" />
                        <span className="text-red-300">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 md:px-8">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                            <div className="p-4 md:p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Users size={16} className="text-cyan-400 md:w-5 md:h-5" />
                                    <span className="text-[var(--foreground-muted)] text-[10px] md:text-sm">Total Users</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-[var(--foreground)]">{stats.totalUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Star size={16} className="text-[var(--foreground-muted)] md:w-5 md:h-5" />
                                    <span className="text-[var(--foreground-muted)] text-[10px] md:text-sm">Core Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-zinc-400">{stats.coreUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Zap size={16} className="text-purple-400 md:w-5 md:h-5" />
                                    <span className="text-[var(--foreground-muted)] text-[10px] md:text-sm">Elite Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-purple-400">{stats.eliteUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Crown size={16} className="text-amber-400 md:w-5 md:h-5" />
                                    <span className="text-[var(--foreground-muted)] text-[10px] md:text-sm">Supreme Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-amber-400">{stats.supremeUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Shield size={16} className="text-cyan-400 md:w-5 md:h-5" />
                                    <span className="text-[var(--foreground-muted)] text-[10px] md:text-sm">System Admins</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-cyan-400">{stats.adminUsers}</p>
                            </div>
                        </div>

                        {/* Tier Distribution */}
                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-cyan-400" />
                                Subscription Distribution
                            </h3>
                            <div className="space-y-4">
                                {(['NITRO_CORE', 'NITRO_ELITE', 'NITRO_SUPREME'] as SubscriptionTier[]).map(tier => {
                                    const info = TIER_INFO[tier];
                                    const count = users.filter(u => u.tier === tier).length;
                                    const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;

                                    return (
                                        <div key={tier}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {info.icon}
                                                    <span className={`font-medium ${info.color}`}>{info.name}</span>
                                                </div>
                                                <span className="text-[var(--foreground-muted)] text-sm">{count} users ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${info.gradient} transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                <Users size={20} className="text-cyan-400" />
                                Recent Users
                            </h3>
                            <div className="space-y-3">
                                {users.slice(0, 5).map(u => (
                                    <div key={u.uid} className="flex items-center gap-4 p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                                        {u.photoURL ? (
                                            <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {u.displayName?.[0] || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[var(--foreground)] truncate">{u.displayName || 'User'}</p>
                                            <p className="text-xs text-[var(--foreground-muted)] truncate">{u.email}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${TIER_INFO[u.tier].bgColor} ${TIER_INFO[u.tier].color}`}>
                                            {TIER_INFO[u.tier].name}
                                        </div>
                                        {u.isAdmin && (
                                            <Shield size={16} className="text-amber-400" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {users.length > 5 && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className="w-full mt-4 py-3 text-center text-cyan-400 hover:text-[var(--foreground)] transition-colors"
                                >
                                    View all {users.length} users →
                                </button>
                            )}
                        </div>

                        {/* Username Change Requests */}
                        <UsernameRequestsAdmin />
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-4 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                        </div>

                        {/* Users List */}
                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-cyan-400" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-20">
                                <Users size={48} className="text-[var(--foreground-muted)] opacity-50 mx-auto mb-4" />
                                <p className="text-[var(--foreground-muted)]">No users found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.uid}
                                        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors hover:bg-[var(--card-hover)]"
                                    >
                                        {/* Main User Row */}
                                        <div className="p-4 flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                {/* User Info */}
                                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                                            {u.displayName?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center flex-wrap gap-1.5">
                                                            <p className="font-bold text-sm text-[var(--foreground)] truncate">{u.displayName || 'User'}</p>
                                                            {u.isAdmin && (
                                                                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded-md">
                                                                    ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-[var(--foreground-muted)] truncate mt-0.5">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions Overlay for Mobile */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => requestAdminToggle(u.uid, u.isAdmin)}
                                                        disabled={updating === u.uid || u.uid === user?.uid}
                                                        className={`p-2 rounded-lg transition-colors ${u.isAdmin
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-[var(--card-hover)] text-[var(--foreground-muted)]'
                                                            } disabled:opacity-30`}
                                                    >
                                                        {u.isAdmin ? <UserCheck size={14} /> : <UserX size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => requestUserDeletion(u.uid, u.displayName || 'User')}
                                                        disabled={updating === u.uid || u.uid === user?.uid}
                                                        className="p-2 rounded-lg transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tier Selector Row */}
                                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
                                                <div className={`px-3 py-1.5 rounded-lg ${TIER_INFO[u.tier].bgColor} ${TIER_INFO[u.tier].color} flex items-center gap-2 shrink-0`}>
                                                    {TIER_INFO[u.tier].icon}
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">{TIER_INFO[u.tier].name.split(' ')[1]}</span>
                                                </div>

                                                <select
                                                    value={u.tier}
                                                    onChange={(e) => updateUserTier(u.uid, e.target.value as SubscriptionTier)}
                                                    disabled={updating === u.uid}
                                                    className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--foreground)] text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:border-cyan-400/50 cursor-pointer flex-1 text-center"
                                                >
                                                    <option value="NITRO_CORE">Core</option>
                                                    <option value="NITRO_ELITE">Elite</option>
                                                    <option value="NITRO_SUPREME">Supreme</option>
                                                </select>

                                                {updating === u.uid && (
                                                    <Loader2 size={14} className="animate-spin text-cyan-400 shrink-0" />
                                                )}
                                            </div>

                                            {/* User Details Expansion */}
                                            {expandedUserId === u.uid && (
                                                <div className="pt-4 border-t border-[var(--border)] space-y-4">
                                                    {loadingUserDetails === u.uid ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <Loader2 size={24} className="animate-spin text-cyan-400" />
                                                        </div>
                                                    ) : userDetails[u.uid] ? (
                                                        <div className="space-y-4">
                                                            {/* Liked Songs */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <Heart size={12} className="text-red-400" />
                                                                    Liked Songs ({userDetails[u.uid].likedSongs.length})
                                                                </h4>
                                                                {userDetails[u.uid].likedSongs.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].likedSongs.slice(0, 5).map((song) => (
                                                                            <div key={song.id} className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg">
                                                                                <img src={song.image} className="w-8 h-8 rounded" alt="" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{song.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)] truncate">{song.artist}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {userDetails[u.uid].likedSongs.length > 5 && (
                                                                            <p className="text-[8px] text-[var(--foreground-muted)] text-center pt-1">
                                                                                +{userDetails[u.uid].likedSongs.length - 5} more
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No liked songs</p>
                                                                )}
                                                            </div>

                                                            {/* Playlists */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <ListMusic size={12} className="text-purple-400" />
                                                                    Playlists ({userDetails[u.uid].playlists.length})
                                                                </h4>
                                                                {userDetails[u.uid].playlists.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].playlists.map((playlist) => (
                                                                            <div key={playlist.id} className="flex items-center justify-between p-2 bg-[var(--background)] rounded-lg">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{playlist.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)]">{playlist.songs?.length || 0} songs</p>
                                                                                </div>
                                                                                {playlist.isPublic ? (
                                                                                    <Globe size={10} className="text-green-400" />
                                                                                ) : (
                                                                                    <LockIcon size={10} className="text-zinc-400" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No playlists created</p>
                                                                )}
                                                            </div>

                                                            {/* Recent Play History */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <Clock size={12} className="text-cyan-400" />
                                                                    Recent Plays ({userDetails[u.uid].playHistory.length})
                                                                </h4>
                                                                {userDetails[u.uid].playHistory.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].playHistory.slice(0, 5).map((song) => (
                                                                            <div key={song.id} className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg">
                                                                                <img src={song.image} className="w-8 h-8 rounded" alt="" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{song.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)] truncate">{song.artist}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {userDetails[u.uid].playHistory.length > 5 && (
                                                                            <p className="text-[8px] text-[var(--foreground-muted)] text-center pt-1">
                                                                                +{userDetails[u.uid].playHistory.length - 5} more
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No play history</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Playlists Tab */}
                {activeTab === 'playlists' && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                value={playlistSearchQuery}
                                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                                placeholder="Search playlists by name, owner, or description..."
                                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-4 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                        </div>

                        {/* Playlists List */}
                        {loadingPlaylists ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-cyan-400" />
                            </div>
                        ) : filteredPlaylists.length === 0 ? (
                            <div className="text-center py-20">
                                <ListMusic size={48} className="text-[var(--foreground-muted)] opacity-50 mx-auto mb-4" />
                                <p className="text-[var(--foreground-muted)]">No playlists found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPlaylists.map(playlist => (
                                    <div
                                        key={playlist.id}
                                        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors hover:bg-[var(--card-hover)]"
                                    >
                                        <div className="p-4 flex flex-col gap-4">
                                            <div className="flex items-start gap-3">
                                                {/* Playlist Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-sm text-[var(--foreground)] truncate">
                                                            {playlist.name}
                                                        </h3>
                                                        {playlist.isPublic ? (
                                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[8px] font-bold rounded-md flex items-center gap-1">
                                                                <Globe size={10} /> PUBLIC
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-[8px] font-bold rounded-md flex items-center gap-1">
                                                                <LockIcon size={10} /> PRIVATE
                                                            </span>
                                                        )}
                                                    </div>
                                                    {playlist.description && (
                                                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1 line-clamp-2">
                                                            {playlist.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--foreground-muted)]">
                                                        <span className="flex items-center gap-1">
                                                            <Music size={10} />
                                                            {playlist.songs?.length || 0} songs
                                                        </span>
                                                        <span>•</span>
                                                        <span>by {playlist.ownerName}</span>
                                                    </div>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => requestPlaylistDeletion(playlist.id, playlist.name)}
                                                    disabled={updating === playlist.id}
                                                    className="p-2 rounded-lg transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-30 shrink-0"
                                                    title="Delete playlist"
                                                >
                                                    {updating === playlist.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab (My Tier) */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 max-w-2xl">
                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-cyan-400" />
                                Change Your Tier
                            </h3>

                            <div className="grid gap-4">
                                {(['NITRO_CORE', 'NITRO_ELITE', 'NITRO_SUPREME'] as SubscriptionTier[]).map((tierOption) => {
                                    const info = TIER_INFO[tierOption];
                                    const isActive = userProfile?.tier === tierOption;

                                    return (
                                        <button
                                            key={tierOption}
                                            onClick={() => user && updateUserTier(user.uid, tierOption)}
                                            disabled={isActive || updating === user?.uid}
                                            className={`p-5 rounded-2xl border transition-all text-left ${isActive
                                                ? `bg-gradient-to-r ${info.gradient} border-transparent`
                                                : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-[var(--foreground)]/10' : info.bgColor}`}>
                                                        {info.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${isActive ? 'text-[var(--foreground)]' : info.color}`}>
                                                            {info.name}
                                                        </h4>
                                                        <p className={`text-xs ${isActive ? 'text-[var(--foreground)]/80' : 'text-[var(--foreground-muted)]'}`}>
                                                            {tierOption === 'NITRO_CORE' && 'Basic features'}
                                                            {tierOption === 'NITRO_ELITE' && '3D Audio, Visualizer'}
                                                            {tierOption === 'NITRO_SUPREME' && 'All premium features'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isActive ? (
                                                    <Check size={20} className="text-[var(--foreground)]" />
                                                ) : (
                                                    <ChevronRight size={20} className="text-[var(--foreground-muted)]" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Your Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--foreground-muted)]">Email</span>
                                    <span className="text-[var(--foreground)]">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--foreground-muted)]">Display Name</span>
                                    <span className="text-[var(--foreground)]">{userProfile?.displayName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--foreground-muted)]">Current Tier</span>
                                    <span className={TIER_INFO[userProfile?.tier || 'NITRO_CORE'].color}>
                                        {TIER_INFO[userProfile?.tier || 'NITRO_CORE'].name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--foreground-muted)]">Admin Status</span>
                                    <span className={userProfile?.isAdmin ? 'text-amber-400' : 'text-[var(--foreground-muted)]'}>
                                        {userProfile?.isAdmin ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[var(--foreground-muted)] mt-16">
                Admin Panel • Nitro Music App v8.0
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && pendingDeleteAction && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--card)] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-6">
                            <AlertTriangle size={32} className="text-red-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-center mb-3 text-[var(--foreground)]">Delete User</h2>
                        <p className="text-center text-[var(--foreground-muted)] mb-6">
                            You are about to permanently delete <span className="text-red-400 font-bold">{pendingDeleteAction.userName}</span> and all their data.
                        </p>

                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                            <p className="text-xs text-red-400 font-medium">
                                ⚠️ This will delete:
                            </p>
                            <ul className="text-xs text-[var(--foreground-muted)] mt-2 space-y-1 ml-4">
                                <li>• User profile and settings</li>
                                <li>• Play history and liked songs</li>
                                <li>• All created playlists</li>
                            </ul>
                            <p className="text-xs text-red-400 font-medium mt-3">
                                This action cannot be undone!
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                                Security Question:
                            </label>
                            <p className="text-sm text-cyan-400 mb-4 font-medium">{securityQuestion}</p>
                            <input
                                type="text"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && verifyAndDeleteUser()}
                                placeholder="Type your answer..."
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-red-400/50 transition-colors"
                                autoFocus
                            />
                            {securityError && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                    <X size={12} /> {securityError}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelDeleteModal}
                                className="flex-1 px-6 py-3 bg-[var(--card-hover)] text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--border)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={verifyAndDeleteUser}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Question Modal */}
            {showSecurityModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={cancelSecurityModal} />
                    <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 text-amber-400">
                            <ShieldAlert size={28} />
                            <h3 className="text-xl font-bold text-[var(--foreground)]">Security Verification</h3>
                        </div>

                        <p className="text-[var(--foreground-muted)] mb-6">
                            You are attempting to modify admin privileges. Please verify your identity to proceed.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                                    {securityQuestion}
                                </label>
                                <input
                                    type="text"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyAndToggleAdmin()}
                                    placeholder="Type your answer..."
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 transition-colors"
                                    autoFocus
                                />
                            </div>

                            {securityError && (
                                <p className="text-red-400 text-sm flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    {securityError}
                                </p>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={cancelSecurityModal}
                                    className="flex-1 px-6 py-3 rounded-xl bg-[var(--card-hover)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={verifyAndToggleAdmin}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

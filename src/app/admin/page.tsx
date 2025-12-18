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
    AlertTriangle, Eye, Mail, Heart, Clock, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

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
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
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
    const [securityError, setSecurityError] = useState<string | null>(null);

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

    // Admin functions moved below


    useEffect(() => {
        if (user && isAdmin) {
            fetchUsers();
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

    // Stats calculation
    const stats = {
        totalUsers: users.length,
        coreUsers: users.filter(u => u.tier === 'NITRO_CORE').length,
        eliteUsers: users.filter(u => u.tier === 'NITRO_ELITE').length,
        supremeUsers: users.filter(u => u.tier === 'NITRO_SUPREME').length,
        adminUsers: users.filter(u => u.isAdmin).length,
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
        <div className="min-h-screen bg-black text-white pb-32">
            <div className="bg-gradient-to-b from-amber-950/30 to-black border-b border-white/5">
                <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2.5 md:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/20">
                                <Shield size={22} className="text-white md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-white">Admin Panel</h1>
                                <p className="text-zinc-500 text-[10px] md:text-sm">Manage users and subscriptions</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loadingUsers}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs"
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
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
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
                            <div className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Users size={16} className="text-cyan-400 md:w-5 md:h-5" />
                                    <span className="text-zinc-500 text-[10px] md:text-sm">Total Users</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-white">{stats.totalUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Star size={16} className="text-zinc-400 md:w-5 md:h-5" />
                                    <span className="text-zinc-500 text-[10px] md:text-sm">Core Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-zinc-400">{stats.coreUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Zap size={16} className="text-purple-400 md:w-5 md:h-5" />
                                    <span className="text-zinc-500 text-[10px] md:text-sm">Elite Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-purple-400">{stats.eliteUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Crown size={16} className="text-amber-400 md:w-5 md:h-5" />
                                    <span className="text-zinc-500 text-[10px] md:text-sm">Supreme Plan</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-amber-400">{stats.supremeUsers}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <Shield size={16} className="text-cyan-400 md:w-5 md:h-5" />
                                    <span className="text-zinc-500 text-[10px] md:text-sm">System Admins</span>
                                </div>
                                <p className="text-xl md:text-3xl font-bold text-cyan-400">{stats.adminUsers}</p>
                            </div>
                        </div>

                        {/* Tier Distribution */}
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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
                                                <span className="text-zinc-400 text-sm">{count} users ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users size={20} className="text-cyan-400" />
                                Recent Users
                            </h3>
                            <div className="space-y-3">
                                {users.slice(0, 5).map(u => (
                                    <div key={u.uid} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                                        {u.photoURL ? (
                                            <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {u.displayName?.[0] || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{u.displayName || 'User'}</p>
                                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
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
                                    className="w-full mt-4 py-3 text-center text-cyan-400 hover:text-white transition-colors"
                                >
                                    View all {users.length} users →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                        </div>

                        {/* Users List */}
                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-cyan-400" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-20">
                                <Users size={48} className="text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500">No users found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.uid}
                                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors hover:bg-white/[0.07]"
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
                                                            <p className="font-bold text-sm text-white truncate">{u.displayName || 'User'}</p>
                                                            {u.isAdmin && (
                                                                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded-md">
                                                                    ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
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
                                                            : 'bg-white/5 text-zinc-600'
                                                            } disabled:opacity-30`}
                                                    >
                                                        {u.isAdmin ? <UserCheck size={14} /> : <UserX size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tier Selector Row */}
                                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                                                <div className={`px-3 py-1.5 rounded-lg ${TIER_INFO[u.tier].bgColor} ${TIER_INFO[u.tier].color} flex items-center gap-2 shrink-0`}>
                                                    {TIER_INFO[u.tier].icon}
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">{TIER_INFO[u.tier].name.split(' ')[1]}</span>
                                                </div>

                                                <select
                                                    value={u.tier}
                                                    onChange={(e) => updateUserTier(u.uid, e.target.value as SubscriptionTier)}
                                                    disabled={updating === u.uid}
                                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:border-cyan-400/50 cursor-pointer flex-1 text-center"
                                                >
                                                    <option value="NITRO_CORE">Core</option>
                                                    <option value="NITRO_ELITE">Elite</option>
                                                    <option value="NITRO_SUPREME">Supreme</option>
                                                </select>

                                                {updating === u.uid && (
                                                    <Loader2 size={14} className="animate-spin text-cyan-400 shrink-0" />
                                                )}
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
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
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
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : info.bgColor}`}>
                                                        {info.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${isActive ? 'text-white' : info.color}`}>
                                                            {info.name}
                                                        </h4>
                                                        <p className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>
                                                            {tierOption === 'NITRO_CORE' && 'Basic features'}
                                                            {tierOption === 'NITRO_ELITE' && '3D Audio, Visualizer'}
                                                            {tierOption === 'NITRO_SUPREME' && 'All premium features'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isActive ? (
                                                    <Check size={20} className="text-white" />
                                                ) : (
                                                    <ChevronRight size={20} className="text-zinc-500" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">Your Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Email</span>
                                    <span className="text-white">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Display Name</span>
                                    <span className="text-white">{userProfile?.displayName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Current Tier</span>
                                    <span className={TIER_INFO[userProfile?.tier || 'NITRO_CORE'].color}>
                                        {TIER_INFO[userProfile?.tier || 'NITRO_CORE'].name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Admin Status</span>
                                    <span className={userProfile?.isAdmin ? 'text-amber-400' : 'text-zinc-400'}>
                                        {userProfile?.isAdmin ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-zinc-600 mt-16">
                Admin Panel • Nitro Music App v8.0
            </div>

            {/* Security Question Modal */}
            {showSecurityModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={cancelSecurityModal} />
                    <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 text-amber-400">
                            <ShieldAlert size={28} />
                            <h3 className="text-xl font-bold text-white">Security Verification</h3>
                        </div>

                        <p className="text-zinc-400 mb-6">
                            You are attempting to modify admin privileges. Please verify your identity to proceed.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 mb-2">
                                    {securityQuestion}
                                </label>
                                <input
                                    type="text"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyAndToggleAdmin()}
                                    placeholder="Type your answer..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-cyan-400/50 transition-colors"
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
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
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

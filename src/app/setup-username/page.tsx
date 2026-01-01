"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AtSign, Check, X, Loader2, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { isRestricted } from '@/lib/usernameUtils';
import { QUICK_AVATARS } from '@/lib/avatarLibrary';
import AvatarPicker from '@/components/AvatarPicker';

export default function SetupUsernamePage() {
    const router = useRouter();
    const { user, userProfile, refreshProfile } = useAuth();
    const [username, setUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation rules
    const validateUsername = (value: string): string | null => {
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 20) return 'Username must be 20 characters or less';
        if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return 'Username must start with a letter and contain only lowercase letters, numbers, and underscores';
        }
        if (isRestricted(value)) {
            return 'This username contains restricted words';
        }
        return null;
    };

    // Check username availability
    useEffect(() => {
        const checkAvailability = async () => {
            const formatted = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (formatted.length < 3) {
                setIsAvailable(null);
                return;
            }

            const validationError = validateUsername(formatted);
            if (validationError) {
                setError(validationError);
                setIsAvailable(false);
                return;
            }

            setIsChecking(true);
            setError(null);

            try {
                // Check in usernames collection
                const usernameRef = doc(db, 'usernames', formatted);
                const usernameSnap = await getDoc(usernameRef);

                if (usernameSnap.exists()) {
                    setIsAvailable(false);
                    setError('This username is already taken');
                } else {
                    setIsAvailable(true);
                    setError(null);
                }
            } catch (err) {
                console.error('Error checking username:', err);
                setError('Error checking availability');
            } finally {
                setIsChecking(false);
            }
        };

        const debounceTimer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(debounceTimer);
    }, [username]);

    // Handle username input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(value);
    };

    // Use quick avatars from library
    const DEFAULT_AVATARS = QUICK_AVATARS.map(a => a.url);

    const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Submit username
    const handleSubmit = async () => {
        if (!user || !isAvailable || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const formatted = username.toLowerCase();

            // Reserve the username
            await setDoc(doc(db, 'usernames', formatted), {
                uid: user.uid,
                createdAt: new Date()
            });

            // Update user profile
            await updateDoc(doc(db, 'users', user.uid), {
                username: formatted,
                photoURL: userProfile?.photoURL || selectedAvatar, // Use selected avatar if none exists
                updatedAt: new Date()
            });

            // Refresh profile and redirect
            await refreshProfile();
            router.push('/');
        } catch (err) {
            console.error('Error setting username:', err);
            setError('Failed to set username. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if already has username
    useEffect(() => {
        if (userProfile?.username) {
            router.push('/');
        }
    }, [userProfile, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <AtSign size={48} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-[var(--foreground)] mb-3 tracking-tight">
                            Create Your Identity
                        </h1>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-6">
                            <p className="text-[var(--foreground)] text-sm font-medium leading-relaxed">
                                Set your username to make it easy for <span className="text-cyan-400 font-bold">friends to find you</span>! 👯‍♂️
                                <br />
                                This isn't about reserving a name—it's about <span className="text-purple-400 font-bold">connecting</span> and sharing your music vibe. 🎵
                            </p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl space-y-8">

                        {/* Avatar Picker */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.2em] text-center">Pick Your Initial Vibe</p>
                            <div className="grid grid-cols-4 gap-3">
                                {DEFAULT_AVATARS.slice(0, 7).map((avatar, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === avatar ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-400/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        <img src={avatar} className="w-full h-full object-cover" alt="" />
                                        {selectedAvatar === avatar && (
                                            <div className="absolute inset-0 bg-cyan-400/10 flex items-center justify-center">
                                                <Check size={16} className="text-cyan-400" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {/* View More Button */}
                                <button
                                    onClick={() => setShowAvatarPicker(true)}
                                    className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[var(--border)] bg-[var(--card-hover)] hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all flex flex-col items-center justify-center gap-1 group"
                                >
                                    <ChevronRight size={20} className="text-[var(--foreground-muted)] group-hover:text-cyan-400 transition-colors" />
                                    <span className="text-[9px] font-bold text-[var(--foreground-muted)] group-hover:text-cyan-400 uppercase">More</span>
                                </button>
                            </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-xl">
                                    @
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleChange}
                                    placeholder="claim_your_handle"
                                    maxLength={20}
                                    className="w-full pl-10 pr-12 py-5 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-xl font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                                />
                                {/* Status Icon */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {isChecking ? (
                                        <Loader2 size={24} className="animate-spin text-cyan-400" />
                                    ) : isAvailable === true ? (
                                        <div className="bg-green-500/20 p-1 rounded-full"><Check size={18} className="text-green-500" /></div>
                                    ) : isAvailable === false ? (
                                        <div className="bg-red-500/20 p-1 rounded-full"><X size={18} className="text-red-500" /></div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Status Messages */}
                            {error && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}
                            {isAvailable && !error && username.length >= 3 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs animate-in fade-in slide-in-from-top-2">
                                    <Sparkles size={14} className="text-amber-400 animate-pulse" />
                                    That handle is pure fire! It's yours.
                                </div>
                            )}
                        </div>

                        {/* Rules & Info */}
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
                                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider mb-1">Visibility</p>
                                    <p className="text-[11px] text-[var(--foreground)] font-bold">Public profile</p>
                                </div>
                                <div className="p-3 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
                                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider mb-1">Discovery</p>
                                    <p className="text-[11px] text-[var(--foreground)] font-bold">Connect with mates</p>
                                </div>
                            </div>
                            <div className="text-[10px] text-[var(--foreground-muted)] px-2 leading-relaxed">
                                Pick wisely! You get <span className="text-amber-400 font-bold">2 free changes</span>.
                                After that, you'll need systemic approval to change your identity.
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!isAvailable || isSubmitting || username.length < 3}
                            className="group relative w-full py-5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-600 hover:from-cyan-400 hover:via-cyan-300 hover:to-purple-500 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-black text-xl rounded-[1.5rem] transition-all duration-300 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-400/60 overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={24} className="animate-bounce" />
                                        Enter the Nitroverse
                                    </>
                                )}
                            </div>
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>

                    <p className="text-center text-[11px] text-[var(--foreground-muted)] mt-8 uppercase tracking-[0.2em] opacity-40">
                        Nitro System v2.0 • Premium Identity
                    </p>
                </div>
            </div>

            {/* Avatar Picker Modal */}
            <AvatarPicker
                isOpen={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={(url) => setSelectedAvatar(url)}
                selectedAvatar={selectedAvatar}
            />
        </>
    );
}


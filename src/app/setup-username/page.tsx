"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AtSign, Check, X, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
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

    // Live preview of the handle as the user types
    const previewHandle = username || 'yourname';

    return (
        <>
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Header — plainly explains what this is */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
                            <AtSign size={28} className="text-[var(--accent)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                            Choose your username
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs mx-auto">
                            This is your unique handle on Nitro, like <span className="text-[var(--foreground)] font-medium">@{previewHandle}</span>.
                            Friends use it to search for you and add you. You can change it later.
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 space-y-6">

                        {/* Username Input — the primary action, first */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[var(--foreground-muted)]">Username</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] font-semibold">@</div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleChange}
                                    placeholder="yourname"
                                    maxLength={20}
                                    autoFocus
                                    className="w-full pl-9 pr-11 py-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-base font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:border-[var(--accent)]/60 transition-colors"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                    {isChecking ? (
                                        <Loader2 size={20} className="animate-spin text-[var(--foreground-muted)]" />
                                    ) : isAvailable === true ? (
                                        <Check size={20} className="text-green-500" />
                                    ) : isAvailable === false ? (
                                        <X size={20} className="text-red-400" />
                                    ) : null}
                                </div>
                            </div>

                            {/* Helper / status line */}
                            {error ? (
                                <p className="flex items-center gap-1.5 text-xs text-red-400">
                                    <AlertCircle size={13} /> {error}
                                </p>
                            ) : isAvailable && username.length >= 3 ? (
                                <p className="flex items-center gap-1.5 text-xs text-green-500">
                                    <Check size={13} /> @{username} is available
                                </p>
                            ) : (
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    3–20 characters · lowercase letters, numbers and underscores
                                </p>
                            )}
                        </div>

                        {/* Avatar Picker */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-[var(--foreground-muted)]">Profile picture</p>
                            <div className="grid grid-cols-4 gap-2.5">
                                {DEFAULT_AVATARS.slice(0, 7).map((avatar, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedAvatar(avatar)}
                                        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === avatar ? 'border-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={avatar} className="w-full h-full object-cover" alt="" />
                                        {selectedAvatar === avatar && (
                                            <div className="absolute inset-0 bg-[var(--accent)]/10 flex items-center justify-center">
                                                <Check size={16} className="text-[var(--accent)]" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowAvatarPicker(true)}
                                    className="w-full aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors flex flex-col items-center justify-center gap-0.5 text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                                >
                                    <ChevronRight size={18} />
                                    <span className="text-[9px] font-semibold uppercase">More</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!isAvailable || isSubmitting || username.length < 3}
                            className="w-full py-3.5 bg-[var(--accent)] text-[#04161a] font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Setting up…</>
                            ) : (
                                'Continue'
                            )}
                        </button>

                        <p className="text-[11px] text-[var(--foreground-muted)] text-center">
                            Your profile is public. You can change your username twice for free.
                        </p>
                    </div>
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


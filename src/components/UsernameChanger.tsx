"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AtSign, Check, X, Loader2, AlertCircle, Clock, Shield } from 'lucide-react';
import { isRestricted } from '@/lib/usernameUtils';

export default function UsernameChanger() {
    const { user, userProfile, refreshProfile } = useAuth();
    const [newUsername, setNewUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);

    const changesLeft = userProfile?.usernameChangesLeft ?? 2;
    const pendingChange = userProfile?.pendingUsernameChange;
    const currentUsername = userProfile?.username;

    // Validation
    const validateUsername = (value: string): string | null => {
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 20) return 'Username must be 20 characters or less';
        if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return 'Must start with letter, only lowercase letters, numbers, underscores';
        }
        if (value === currentUsername) return 'This is already your username';
        if (isRestricted(value)) {
            return 'This username contains restricted words';
        }
        return null;
    };

    // Check availability
    useEffect(() => {
        const checkAvailability = async () => {
            const formatted = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
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
                const usernameRef = doc(db, 'usernames', formatted);
                const usernameSnap = await getDoc(usernameRef);

                if (usernameSnap.exists()) {
                    setIsAvailable(false);
                    setError('Username is taken');
                } else {
                    setIsAvailable(true);
                    setError(null);
                }
            } catch (err) {
                setError('Error checking availability');
            } finally {
                setIsChecking(false);
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [newUsername, currentUsername]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    };

    // Change username (if changes left > 0)
    const handleDirectChange = async () => {
        if (!user || !isAvailable || changesLeft <= 0) return;

        setIsSubmitting(true);
        try {
            const formatted = newUsername.toLowerCase();

            // Release old username
            if (currentUsername) {
                await deleteDoc(doc(db, 'usernames', currentUsername));
            }

            // Reserve new username
            await setDoc(doc(db, 'usernames', formatted), {
                uid: user.uid,
                createdAt: new Date()
            });

            // Update profile
            await updateDoc(doc(db, 'users', user.uid), {
                username: formatted,
                usernameChangesLeft: changesLeft - 1,
                updatedAt: new Date()
            });

            await refreshProfile();
            setShowChangeForm(false);
            setNewUsername('');
        } catch (err) {
            setError('Failed to change username');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Request admin approval (if no changes left)
    const handleRequestChange = async () => {
        if (!user || !isAvailable || pendingChange) return;

        setIsSubmitting(true);
        try {
            const formatted = newUsername.toLowerCase();

            // Create username change request
            await setDoc(doc(db, 'usernameRequests', user.uid), {
                uid: user.uid,
                currentUsername: currentUsername,
                requestedUsername: formatted,
                displayName: userProfile?.displayName,
                email: userProfile?.email,
                requestedAt: new Date(),
                status: 'pending'
            });

            // Update user profile with pending change
            await updateDoc(doc(db, 'users', user.uid), {
                pendingUsernameChange: formatted,
                updatedAt: new Date()
            });

            await refreshProfile();
            setShowChangeForm(false);
            setNewUsername('');
        } catch (err) {
            setError('Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userProfile) return null;

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <AtSign size={16} className="text-cyan-400" />
                    <span className="text-sm font-bold text-[var(--foreground)]">Username</span>
                </div>
                {changesLeft > 0 ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
                        {changesLeft} change{changesLeft > 1 ? 's' : ''} left
                    </span>
                ) : pendingChange ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        Pending approval
                    </span>
                ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-medium flex items-center gap-1">
                        <Shield size={10} />
                        Needs admin approval
                    </span>
                )}
            </div>

            {/* Current Username */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-medium text-[var(--foreground)]">
                    @{currentUsername || 'not set'}
                </span>
            </div>

            {/* Pending Request Notice */}
            {pendingChange && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3 text-sm">
                    <Clock size={16} className="text-amber-400" />
                    <span className="text-amber-400">
                        Waiting for admin approval to change to <strong>@{pendingChange}</strong>
                    </span>
                </div>
            )}

            {/* Change Form */}
            {!pendingChange && (
                <>
                    {!showChangeForm ? (
                        <button
                            onClick={() => setShowChangeForm(true)}
                            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                            Change username
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {/* Input */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">@</span>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={handleChange}
                                    placeholder="new_username"
                                    maxLength={20}
                                    className="w-full pl-8 pr-10 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isChecking ? (
                                        <Loader2 size={16} className="animate-spin text-[var(--foreground-muted)]" />
                                    ) : isAvailable ? (
                                        <Check size={16} className="text-green-500" />
                                    ) : isAvailable === false ? (
                                        <X size={16} className="text-red-500" />
                                    ) : null}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-[10px] text-red-400 flex items-center gap-1">
                                    <AlertCircle size={10} /> {error}
                                </p>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowChangeForm(false);
                                        setNewUsername('');
                                        setError(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Cancel
                                </button>

                                {changesLeft > 0 ? (
                                    <button
                                        onClick={handleDirectChange}
                                        disabled={!isAvailable || isSubmitting}
                                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        Change Username
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRequestChange}
                                        disabled={!isAvailable || isSubmitting}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                        Request Admin Approval
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

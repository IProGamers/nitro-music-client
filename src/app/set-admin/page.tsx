"use client"
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, Check, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ADMIN_SECRET = 'nitro-ipro-2024';

export default function SetAdminPage() {
    const { user, userProfile, refreshProfile, loading: authLoading } = useAuth();
    const [secretInput, setSecretInput] = useState('');
    const [secretVerified, setSecretVerified] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const makeAdmin = async () => {
        if (!user) {
            setMessage('Please sign in first');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                isAdmin: true,
                updatedAt: new Date()
            });
            await refreshProfile();
            setStatus('success');
            setMessage('You are now an admin! Redirecting...');

            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/admin';
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.message || 'Failed to set admin status');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    if (!secretVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-black">
                <div className="max-w-sm w-full text-center space-y-6">
                    <Shield size={40} className="text-amber-400 mx-auto" />
                    <h1 className="text-2xl font-bold text-white">Enter Admin Secret</h1>
                    <input
                        type="password"
                        value={secretInput}
                        onChange={e => setSecretInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && secretInput === ADMIN_SECRET && setSecretVerified(true)}
                        placeholder="Secret code"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:border-amber-400/50"
                    />
                    <button
                        onClick={() => secretInput === ADMIN_SECRET && setSecretVerified(true)}
                        className="w-full py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-colors"
                    >
                        Verify
                    </button>
                    {secretInput && secretInput !== ADMIN_SECRET && (
                        <p className="text-red-400 text-sm">Wrong secret</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20">
                    <Shield size={40} className="text-white" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
                <p className="text-zinc-400 mb-8">
                    {user
                        ? `Logged in as ${userProfile?.displayName || user.email}`
                        : 'Please sign in first to get admin access'
                    }
                </p>

                {userProfile?.isAdmin ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                            <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                                <Check size={20} />
                                You already have admin access!
                            </p>
                        </div>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-colors"
                        >
                            Go to Admin Panel
                        </Link>
                    </div>
                ) : user ? (
                    <div className="space-y-4">
                        {status === 'success' ? (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                                <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                                    <Check size={20} />
                                    {message}
                                </p>
                            </div>
                        ) : status === 'error' ? (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                                <p className="text-red-400">{message}</p>
                            </div>
                        ) : null}

                        <button
                            onClick={makeAdmin}
                            disabled={status === 'loading' || status === 'success'}
                            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Make Me Admin
                                </>
                            )}
                        </button>

                        <p className="text-xs text-zinc-600">
                            This is a development tool. In production, admin access should be granted through Firebase Console.
                        </p>
                    </div>
                ) : (
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 transition-colors"
                    >
                        Sign In First
                    </Link>
                )}

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mt-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
            </div>
        </div>
    );
}

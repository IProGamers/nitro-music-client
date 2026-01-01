"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Mail, Lock, User, Eye, EyeOff, Loader2,
    Music, Sparkles, ArrowRight, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Allowed email domains - only real email providers
const ALLOWED_EMAIL_DOMAINS = [
    // Google
    'gmail.com', 'googlemail.com',
    // Microsoft
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    // Yahoo
    'yahoo.com', 'yahoo.in', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Privacy-focused
    'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com', 'tutamail.com',
    // Indian providers
    'rediffmail.com', 'in.com',
    // Other popular
    'aol.com', 'zoho.com', 'zohomail.in', 'mail.com',
    // Educational
    'edu', '.edu.in', '.ac.in',
];

// Check if email domain is allowed
const isEmailAllowed = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    // Check for exact matches or edu domains
    return ALLOWED_EMAIL_DOMAINS.some(allowed => {
        if (allowed.startsWith('.')) {
            // Suffix match (e.g., .edu.in)
            return domain.endsWith(allowed);
        }
        return domain === allowed || domain.endsWith('.' + allowed);
    });
};

export default function AuthPage() {
    const { user, loading, error, signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();
    const router = useRouter();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            // Check if there's a pending room to join
            const pendingRoom = localStorage.getItem('pendingRoomJoin');
            if (pendingRoom) {
                localStorage.removeItem('pendingRoomJoin');
                router.push(`/join/${pendingRoom}`);
            } else {
                router.push('/profile');
            }
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setSubmitting(true);

        try {
            if (isSignUp) {
                if (!displayName.trim()) {
                    throw new Error('Please enter your name');
                }
                // Validate email domain during signup
                if (!isEmailAllowed(email)) {
                    throw new Error('Please use a valid email provider (Gmail, Outlook, Yahoo, Proton, iCloud, etc.)');
                }
                await signUp(email, password, displayName);
            } else {
                await signIn(email, password);
            }
            // Check for pending room
            const pendingRoom = localStorage.getItem('pendingRoomJoin');
            if (pendingRoom) {
                localStorage.removeItem('pendingRoomJoin');
                router.push(`/join/${pendingRoom}`);
            } else {
                router.push('/profile');
            }
        } catch (err: any) {
            setLocalError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLocalError(null);
        try {
            await signInWithGoogle();
            // Check for pending room
            const pendingRoom = localStorage.getItem('pendingRoomJoin');
            if (pendingRoom) {
                localStorage.removeItem('pendingRoomJoin');
                router.push(`/join/${pendingRoom}`);
            } else {
                router.push('/profile');
            }
        } catch (err: any) {
            setLocalError(err.message || 'Google sign-in failed');
        }
    };

    const handleGithubSignIn = async () => {
        setLocalError(null);
        try {
            await signInWithGithub();
            router.push('/profile');
        } catch (err: any) {
            setLocalError(err.message || 'GitHub sign-in failed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="animate-spin text-cyan-400" />
                    <p className="text-[var(--foreground-muted)]">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex flex-col items-center gap-6 group">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.2)] group-hover:scale-110 transition-transform">
                            <img src="/logo.png" className="w-full h-full object-cover" alt="Nitro Logo" />
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-[var(--foreground)] tracking-tighter">
                                Nitro
                            </span>
                            <span className="text-sm font-bold text-[var(--foreground-muted)] tracking-[0.2em] lowercase opacity-50">by ipro</span>
                        </div>
                    </Link>
                    <p className="text-[var(--foreground-muted)] mt-3 text-sm">
                        {isSignUp ? 'Create your account to start streaming' : 'Welcome back, music lover'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-[var(--card)]/80 backdrop-blur-2xl border border-[var(--border)] rounded-3xl p-8 shadow-2xl">
                    {/* Error Display */}
                    {(localError || error) && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{localError || error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field (Sign Up only) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                                    Display Name
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl pl-12 pr-12 py-3.5 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                        >
                            {submitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[var(--border)]"></div>
                        <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">or continue with</span>
                        <div className="flex-1 h-px bg-[var(--border)]"></div>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-[var(--card-hover)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    {/* Toggle Sign In/Up */}
                    <div className="mt-8 text-center">
                        <p className="text-[var(--foreground-muted)] text-sm">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setLocalError(null); }}
                                className="text-cyan-400 font-medium hover:underline"
                            >
                                {isSignUp ? 'Sign In' : 'Create One'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="mt-8 flex items-center justify-center gap-6 text-[var(--foreground-muted)] text-xs">
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-cyan-400" />
                        3D Audio
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-400" />
                        Unlimited Streaming
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-400" />
                        Premium Quality
                    </div>
                </div>
            </div>
        </div>
    );
}

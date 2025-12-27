"use client"
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Sparkles, ArrowDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccountNotificationModal() {
    const { accountNotification, clearAccountNotification } = useAuth();
    const router = useRouter();

    if (!accountNotification) return null;

    const getIcon = () => {
        switch (accountNotification.type) {
            case 'deleted':
                return <AlertTriangle className="w-16 h-16 text-red-500" />;
            case 'plan_upgraded':
                return <Sparkles className="w-16 h-16 text-yellow-400" />;
            case 'plan_downgraded':
                return <ArrowDown className="w-16 h-16 text-blue-400" />;
            default:
                return null;
        }
    };

    const getGradient = () => {
        switch (accountNotification.type) {
            case 'deleted':
                return 'from-red-600/20 via-red-900/30 to-black';
            case 'plan_upgraded':
                return 'from-yellow-600/20 via-purple-900/30 to-black';
            case 'plan_downgraded':
                return 'from-blue-600/20 via-gray-900/30 to-black';
            default:
                return 'from-gray-600/20 to-black';
        }
    };

    const handleDismiss = () => {
        clearAccountNotification();
        if (accountNotification.type === 'deleted') {
            router.push('/auth');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className={`relative max-w-md w-full mx-4 p-8 rounded-3xl bg-gradient-to-b ${getGradient()} border border-white/10 shadow-2xl`}>
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="w-5 h-5 text-white/70" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-white/5 animate-pulse">
                        {getIcon()}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-white mb-4">
                    {accountNotification.type === 'deleted' && 'Account Removed'}
                    {accountNotification.type === 'plan_upgraded' && 'You\'ve Been Upgraded! 🎉'}
                    {accountNotification.type === 'plan_downgraded' && 'Plan Changed'}
                </h2>

                {/* Message */}
                <p className="text-center text-white/80 text-lg mb-8">
                    {accountNotification.message}
                </p>

                {/* Action Button */}
                <button
                    onClick={handleDismiss}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${accountNotification.type === 'deleted'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                            : accountNotification.type === 'plan_upgraded'
                                ? 'bg-gradient-to-r from-yellow-500 to-purple-600 hover:from-yellow-600 hover:to-purple-700 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                        }`}
                >
                    {accountNotification.type === 'deleted' ? 'Create New Account' : 'Got it!'}
                </button>

                {accountNotification.type === 'deleted' && (
                    <p className="text-center text-white/50 text-sm mt-4">
                        Contact support if you believe this was a mistake.
                    </p>
                )}
            </div>
        </div>
    );
}

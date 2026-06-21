"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { FeatureKey, PLAN_LIMITS, FEATURE_NAMES } from '@/lib/features';

interface UsageState {
    [key: string]: {
        count: number;
        lastReset: number; // timestamp
    };
}

interface CheckResult {
    allowed: boolean;
    reason?: 'limit_reached' | 'locked';
    remaining?: number;
    limit?: number;
}

interface UsageContextType {
    checkAccess: (feature: FeatureKey) => CheckResult;
    trackUsage: (feature: FeatureKey) => void;
    getUsage: (feature: FeatureKey) => number;
    resetUsage: () => void;
    showLimitModal: boolean;
    setShowLimitModal: (v: boolean) => void;
    limitFeature: FeatureKey | null;
    setLimitFeature: (v: FeatureKey | null) => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const UsageProvider = ({ children }: { children: React.ReactNode }) => {
    const { tier } = useSettings();
    const [usage, setUsage] = useState<UsageState>({});
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitFeature, setLimitFeature] = useState<FeatureKey | null>(null);

    // Initial load
    useEffect(() => {
        try {
            const stored = localStorage.getItem('nitro_usage_v1');
            if (stored) {
                setUsage(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load usage stats", e);
        }
    }, []);

    // Save on change
    useEffect(() => {
        if (Object.keys(usage).length > 0) {
            localStorage.setItem('nitro_usage_v1', JSON.stringify(usage));
        }
    }, [usage]);

    const shouldReset = (feature: FeatureKey, lastReset: number, period?: 'day' | 'month' | 'forever') => {
        if (!period || period === 'forever') return false;

        const last = new Date(lastReset);
        const now = new Date();

        if (period === 'day') {
            return now.getDate() !== last.getDate() ||
                now.getMonth() !== last.getMonth() ||
                now.getFullYear() !== last.getFullYear();
        }
        if (period === 'month') {
            return now.getMonth() !== last.getMonth() ||
                now.getFullYear() !== last.getFullYear();
        }
        return false;
    };

    // Binary access model: anyone who can reach the app is an approved user and
    // gets full, unlimited access. All per-tier feature limits are removed.
    const checkAccess = (_feature: FeatureKey): CheckResult => {
        return { allowed: true, limit: -1 };
    };

    // No-op: usage limits no longer exist.
    const trackUsage = (_feature: FeatureKey) => { /* unlimited */ };

    const getUsage = (_feature: FeatureKey) => 0;

    const resetUsage = () => setUsage({});

    return (
        <UsageContext.Provider value={{
            checkAccess,
            trackUsage,
            getUsage,
            resetUsage,
            showLimitModal,
            setShowLimitModal,
            limitFeature,
            setLimitFeature
        }}>
            {children}
        </UsageContext.Provider>
    );
};

export const useUsage = () => {
    const context = useContext(UsageContext);
    if (!context) throw new Error("useUsage must be used within UsageProvider");
    return context;
};

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

    const checkAccess = (feature: FeatureKey): CheckResult => {
        const validTier = tier || 'NITRO_CORE';
        const limits = PLAN_LIMITS[validTier] || PLAN_LIMITS['NITRO_CORE'];
        const limitConfig = limits[feature];

        if (!limitConfig) return { allowed: true };
        if (limitConfig.max === -1) return { allowed: true, limit: -1 };

        const state = usage[feature];
        let currentCount = state?.count || 0;

        // Check if we should pretend it's 0 (reset due)
        if (state && shouldReset(feature, state.lastReset, limitConfig.period)) {
            currentCount = 0;
        }

        if (currentCount >= limitConfig.max) {
            return {
                allowed: false,
                reason: 'limit_reached',
                remaining: 0,
                limit: limitConfig.max
            };
        }

        return {
            allowed: true,
            remaining: limitConfig.max - currentCount,
            limit: limitConfig.max
        };
    };

    const trackUsage = (feature: FeatureKey) => {
        const validTier = tier || 'NITRO_CORE';
        const limits = PLAN_LIMITS[validTier] || PLAN_LIMITS['NITRO_CORE'];
        const limitConfig = limits[feature];

        if (!limitConfig || limitConfig.max === -1) return;

        setUsage(prev => {
            const now = Date.now();
            const current = prev[feature] || { count: 0, lastReset: now };

            let newCount = current.count;
            let newReset = current.lastReset;

            const needsReset = shouldReset(feature, current.lastReset, limitConfig.period);

            if (needsReset) {
                newCount = 1; // Reset and count this one
                newReset = now;
            } else {
                newCount += 1;
            }

            return {
                ...prev,
                [feature]: {
                    count: newCount,
                    lastReset: newReset
                }
            };
        });
    };

    const getUsage = (feature: FeatureKey) => {
        const validTier = tier || 'NITRO_CORE';
        const limits = PLAN_LIMITS[validTier] || PLAN_LIMITS['NITRO_CORE'];
        const limitConfig = limits[feature];

        const state = usage[feature];
        if (!state) return 0;

        if (shouldReset(feature, state.lastReset, limitConfig?.period)) return 0;

        return state.count;
    };

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

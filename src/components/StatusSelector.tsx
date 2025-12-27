"use client"
import { useState } from 'react';
import { useAuth, UserStatus } from '@/context/AuthContext';
import { Circle, Moon, MinusCircle, Ghost, ChevronDown } from 'lucide-react';

const statusOptions: { value: UserStatus; label: string; icon: any; color: string; bgColor: string }[] = [
    { value: 'online', label: 'Online', icon: Circle, color: 'text-green-400', bgColor: 'bg-green-500' },
    { value: 'idle', label: 'Idle', icon: Moon, color: 'text-amber-400', bgColor: 'bg-amber-500' },
    { value: 'dnd', label: 'Do Not Disturb', icon: MinusCircle, color: 'text-red-400', bgColor: 'bg-red-500' },
    { value: 'invisible', label: 'Invisible', icon: Ghost, color: 'text-gray-400', bgColor: 'bg-gray-500' }
];

export default function StatusSelector() {
    const { userProfile, updateUserStatus } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const currentStatus = userProfile?.status || 'online';
    const current = statusOptions.find(o => o.value === currentStatus) || statusOptions[0];

    const handleSelect = async (status: UserStatus) => {
        if (status === currentStatus) {
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            await updateUserStatus(status);
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            {/* Current Status Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--card-hover)] transition-all"
            >
                <div className={`w-3 h-3 rounded-full ${current.bgColor}`} />
                <span className="text-sm font-medium text-[var(--foreground)]">{current.label}</span>
                <ChevronDown size={14} className={`text-[var(--foreground-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] border-b border-[var(--border)]">
                        Set Status
                    </p>
                    {statusOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--card-hover)] ${option.value === currentStatus ? 'bg-[var(--background)]' : ''
                                    }`}
                            >
                                <Icon size={16} className={option.color} fill={option.value === 'online' ? 'currentColor' : 'none'} />
                                <span className="text-sm text-[var(--foreground)]">{option.label}</span>
                                {option.value === currentStatus && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

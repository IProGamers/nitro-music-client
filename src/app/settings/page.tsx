"use client"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, LogOut, Shield, Moon, Sun, ChevronRight } from 'lucide-react';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-[var(--accent)]' : 'bg-[var(--surface-hover)]'}`}
            aria-pressed={on}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
    );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                {desc && <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{desc}</p>}
            </div>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, userProfile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const {
        audioQuality, setAudioQuality,
        autoPlay, setAutoPlay,
        enable3DAudio, setEnable3DAudio,
        enableDownload, setEnableDownload,
        visualizer, setVisualizer,
        musicSource, setMusicSource,
    } = useSettings();

    const qualities: Array<{ id: 'low' | 'medium' | 'high' | 'supreme'; label: string }> = [
        { id: 'low', label: 'Data Saver' },
        { id: 'medium', label: 'Standard' },
        { id: 'high', label: 'High' },
        { id: 'supreme', label: 'Lossless' },
    ];

    return (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-32 overflow-x-hidden w-full">
            <header className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--foreground)]">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Settings</h1>
            </header>

            {/* Account */}
            <section className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Account</h2>
                <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4">
                    <div className="flex items-center gap-3 py-4">
                        {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">{userProfile?.displayName?.[0] || 'U'}</div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{userProfile?.displayName || 'User'}</p>
                            <p className="text-xs text-[var(--foreground-muted)] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="border-t border-[var(--border)]">
                        <Link href="/profile" className="flex items-center justify-between py-3.5 text-sm text-[var(--foreground)]">
                            Edit profile <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
                        </Link>
                    </div>
                    {userProfile?.isAdmin && (
                        <div className="border-t border-[var(--border)]">
                            <Link href="/admin" className="flex items-center justify-between py-3.5 text-sm text-[var(--foreground)]">
                                <span className="flex items-center gap-2"><Shield size={15} className="text-amber-400" /> Admin panel</span>
                                <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Audio Engine */}
            <section className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Streaming Provider</h2>
                <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
                    <p className="text-xs text-[var(--foreground-muted)] mb-3">Ultra-low latency lossless streaming directly served via high-speed global CDN.</p>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                        <div>
                            <span className="text-sm font-semibold text-white">JioSaavn CDN</span>
                            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">320kbps High Quality AAC/MP3 • Active</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Connected
                        </span>
                    </div>
                </div>
            </section>

            {/* Appearance */}
            <section className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Appearance</h2>
                <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4">
                    <Row label="Theme" desc={theme === 'dark' ? 'Dark' : 'Light'}>
                        <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-[var(--background)] flex items-center justify-center">
                            {theme === 'dark' ? <Moon size={16} className="text-[var(--accent)]" /> : <Sun size={16} className="text-amber-400" />}
                        </button>
                    </Row>
                </div>
            </section>

            {/* Playback */}
            <section className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2">Playback</h2>
                <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 divide-y divide-[var(--border)]">
                    <div className="py-3.5">
                        <p className="text-sm font-medium text-[var(--foreground)] mb-2">Audio quality</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {qualities.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => setAudioQuality(q.id)}
                                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${audioQuality === q.id ? 'bg-[var(--accent)] text-[#04161a]' : 'bg-[var(--background)] text-[var(--foreground-secondary)]'}`}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Row label="Autoplay" desc="Keep playing similar songs when your music ends">
                        <Toggle on={autoPlay} onClick={() => setAutoPlay(!autoPlay)} />
                    </Row>
                    <Row label="3D / Spatial audio">
                        <Toggle on={enable3DAudio} onClick={() => setEnable3DAudio(!enable3DAudio)} />
                    </Row>
                    <Row label="Visualizer">
                        <Toggle on={visualizer} onClick={() => setVisualizer(!visualizer)} />
                    </Row>
                    <Row label="Downloads" desc="Allow downloading songs for offline play">
                        <Toggle on={enableDownload} onClick={() => setEnableDownload(!enableDownload)} />
                    </Row>
                </div>
            </section>

            {user && (
                <button
                    onClick={async () => { await signOut(); router.push('/auth'); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--surface)] hover:bg-red-500/10 text-red-400 font-medium text-sm transition-colors border border-[var(--border)]"
                >
                    <LogOut size={16} /> Sign out
                </button>
            )}
        </div>
    );
}

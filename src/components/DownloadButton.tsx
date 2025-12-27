"use client"
import { Download, Check, Loader2, Trash2 } from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { useState } from 'react';

interface DownloadButtonProps {
    song: any;
    size?: number;
    className?: string;
    showLabel?: boolean;
}

export default function DownloadButton({ song, size = 18, className = '', showLabel = false }: DownloadButtonProps) {
    const { isDownloaded, downloadSong, removeSong, isDownloading, currentDownloadId, downloadProgress } = useOffline();
    const [error, setError] = useState<string | null>(null);

    const songId = String(song?.id);
    const downloaded = isDownloaded(songId);
    const isCurrentlyDownloading = isDownloading && currentDownloadId === songId;

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setError(null);

        if (downloaded) {
            // Remove download
            try {
                await removeSong(songId);
            } catch (err) {
                setError('Failed to remove');
            }
        } else if (!isCurrentlyDownloading) {
            // Start download
            try {
                await downloadSong(song);
            } catch (err: any) {
                setError(err.message || 'Download failed');
            }
        }
    };

    if (!song) return null;

    return (
        <button
            onClick={handleDownload}
            className={`relative group transition-all ${className}`}
            title={downloaded ? 'Remove download' : isCurrentlyDownloading ? 'Downloading...' : 'Download for offline'}
        >
            {isCurrentlyDownloading ? (
                <div className="relative">
                    <Loader2 size={size} className="animate-spin text-cyan-400" />
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-400">
                        {downloadProgress}%
                    </span>
                </div>
            ) : downloaded ? (
                <div className="relative flex items-center gap-1.5">
                    <div className="relative">
                        <Check size={size} className="text-emerald-400" />
                        <div className="absolute inset-0 group-hover:hidden">
                            <Check size={size} className="text-emerald-400" />
                        </div>
                        <div className="absolute inset-0 hidden group-hover:block">
                            <Trash2 size={size} className="text-red-400" />
                        </div>
                    </div>
                    {showLabel && (
                        <span className="text-[10px] font-bold text-emerald-400 group-hover:text-red-400">
                            <span className="group-hover:hidden">Saved</span>
                            <span className="hidden group-hover:inline">Remove</span>
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <Download
                        size={size}
                        className="text-[var(--foreground-muted)] hover:text-cyan-400 transition-colors"
                    />
                    {showLabel && (
                        <span className="text-[10px] font-bold text-[var(--foreground-muted)] group-hover:text-cyan-400">
                            Download
                        </span>
                    )}
                </div>
            )}

            {error && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-red-400 whitespace-nowrap">
                    {error}
                </span>
            )}
        </button>
    );
}

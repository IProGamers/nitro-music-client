"use client"
import { useState } from 'react';
import { Search, Mic, Play, Clock, Headphones } from 'lucide-react';
import Link from 'next/link';

// Note: This is a placeholder page. Podcast support requires an external podcast API
// Options: Spotify API (requires partnership), Podcast Index API (open), or Listen Notes API

export default function PodcastsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder data - would come from podcast API
    const featuredPodcasts = [
        {
            id: '1',
            name: 'The Daily',
            publisher: 'The New York Times',
            image: 'https://via.placeholder.com/300x300?text=Podcast',
            description: 'This is what the news should sound like.'
        },
        {
            id: '2',
            name: 'Huberman Lab',
            publisher: 'Scicomm Media',
            image: 'https://via.placeholder.com/300x300?text=Science',
            description: 'Science-based tools for everyday life.'
        },
        {
            id: '3',
            name: 'Lex Fridman Podcast',
            publisher: 'Lex Fridman',
            image: 'https://via.placeholder.com/300x300?text=Tech',
            description: 'Conversations about science, technology, and the human condition.'
        }
    ];

    const categories = [
        'Technology', 'Business', 'Health & Fitness', 'Comedy',
        'True Crime', 'Education', 'News', 'Sports', 'Music', 'Science'
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                        <Mic size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Podcasts</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">Discover shows and episodes</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search podcasts..."
                        className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                    />
                </div>

                {/* Coming Soon Banner */}
                <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl mb-8">
                    <div className="flex items-center gap-4">
                        <Headphones size={40} className="text-green-400" />
                        <div>
                            <h2 className="font-bold text-lg text-[var(--foreground)]">Podcasts Coming Soon!</h2>
                            <p className="text-sm text-[var(--foreground-muted)]">
                                We're working on integrating podcast support. Stay tuned for shows, episodes,
                                playback speed controls, and more!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-4">Browse Categories</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-full text-sm font-medium text-[var(--foreground)] hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 transition-all"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Podcasts */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Featured Shows</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {featuredPodcasts.map((podcast) => (
                            <div
                                key={podcast.id}
                                className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-green-500/30 hover:bg-green-500/5 transition-all cursor-pointer group"
                            >
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 shrink-0 rounded-xl bg-[var(--background)] overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                            <Mic size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-green-400 transition-colors">
                                            {podcast.name}
                                        </h3>
                                        <p className="text-xs text-[var(--foreground-muted)] truncate mb-2">
                                            {podcast.publisher}
                                        </p>
                                        <p className="text-[10px] text-[var(--foreground-muted)] line-clamp-2">
                                            {podcast.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Preview */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Play size={20} className="text-green-400" />
                        </div>
                        <h3 className="font-bold text-sm">Playback Speed</h3>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">0.5x to 2x speed control</p>
                    </div>
                    <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Clock size={20} className="text-green-400" />
                        </div>
                        <h3 className="font-bold text-sm">Resume Playback</h3>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">Continue where you left off</p>
                    </div>
                    <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Headphones size={20} className="text-green-400" />
                        </div>
                        <h3 className="font-bold text-sm">Sleep Timer</h3>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">Auto-stop after set time</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

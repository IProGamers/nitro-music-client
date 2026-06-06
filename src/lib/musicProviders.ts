import { Track } from "@/types/music";
import { normalizeTrack } from "./utils";

export interface MusicProvider {
    name: string;
    priority: number;
    searchSongs: (query: string, limit?: number) => Promise<Track[]>;
    getSongDetails: (id: string) => Promise<Track | null>;
    isHealthy: () => boolean;
}

class JioSaavnProvider implements MusicProvider {
    name = "JioSaavn";
    priority = 1;
    private failures = 0;
    private lastFailure = 0;

    isHealthy() {
        if (this.failures > 5 && Date.now() - this.lastFailure < 60000) return false;
        return true;
    }

    private markFailure() {
        this.failures++;
        this.lastFailure = Date.now();
    }

    private resetFailures() {
        this.failures = 0;
    }

    async searchSongs(query: string, limit = 20): Promise<Track[]> {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            this.resetFailures();
            return (data.data?.results || []).map(normalizeTrack);
        } catch (e) {
            this.markFailure();
            return [];
        }
    }

    async getSongDetails(id: string): Promise<Track | null> {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/api/songs?id=${id}`);
            if (!res.ok) throw new Error("Details failed");
            const data = await res.json();
            this.resetFailures();
            const trackData = data.data?.[0];
            return trackData ? normalizeTrack(trackData) : null;
        } catch (e) {
            this.markFailure();
            return null;
        }
    }
}

export const musicPlatform = {
    providers: [new JioSaavnProvider()],
    
    async search(query: string, limit = 20): Promise<Track[]> {
        // Try healthy providers in priority order
        for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
            if (provider.isHealthy()) {
                const results = await provider.searchSongs(query, limit);
                if (results.length > 0) return results;
            }
        }
        return [];
    },

    async getDetails(id: string): Promise<Track | null> {
        for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
            if (provider.isHealthy()) {
                const details = await provider.getSongDetails(id);
                if (details) return details;
            }
        }
        return null;
    }
};

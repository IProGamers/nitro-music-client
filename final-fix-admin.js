const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Add Eye button
// We'll use a regex that is flexible with whitespace and line endings
const trashButtonRegex = /(<button[^>]*onClick=\{\(\) => requestUserDeletion\(u\.uid, u\.displayName \|\| 'User'\)\}[^>]*>[\s\S]*?<Trash2[^>]*\/>[\s\S]*?<\/button>)/;

const eyeButton = `\n                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>`;

if (trashButtonRegex.test(content)) {
    content = content.replace(trashButtonRegex, `$1${eyeButton}`);
    console.log('✅ Found Trash button and added Eye button');
} else {
    console.log('❌ Could not find Trash button with regex');
}

// 2. Add Expansion UI
const tierRowEndRegex = /(<Loader2 size=\{14\} className="animate-spin text-cyan-400 shrink-0" \/>\s*)(\n\s*)(\}\s*<\/div>\s*)(<\/div>\s*)(<\/div>\s*)(?=\{filteredUsers\.map)/;
// Actually let's try a simpler one for the tier row end
const tierRowEndMarker = /\{\s*updating === u\.uid && \(\s*<Loader2 size=\{14\} className="animate-spin text-cyan-400 shrink-0" \/>\s*\)\s*\}\s*<\/div>/;

const expansionUI = `\n\n                                            {/* User Details Expansion */}
                                            {expandedUserId === u.uid && (
                                                <div className="pt-4 border-t border-[var(--border)] space-y-4">
                                                    {loadingUserDetails === u.uid ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <Loader2 size={24} className="animate-spin text-cyan-400" />
                                                        </div>
                                                    ) : userDetails[u.uid] ? (
                                                        <div className="space-y-4">
                                                            {/* Liked Songs */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <Heart size={12} className="text-red-400" />
                                                                    Liked Songs ({userDetails[u.uid].likedSongs.length})
                                                                </h4>
                                                                {userDetails[u.uid].likedSongs.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].likedSongs.slice(0, 5).map((song) => (
                                                                            <div key={song.id} className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg">
                                                                                <img src={song.image} className="w-8 h-8 rounded" alt="" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{song.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)] truncate">{song.artist}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {userDetails[u.uid].likedSongs.length > 5 && (
                                                                            <p className="text-[8px] text-[var(--foreground-muted)] text-center pt-1">
                                                                                +{userDetails[u.uid].likedSongs.length - 5} more
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No liked songs</p>
                                                                )}
                                                            </div>

                                                            {/* Playlists */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <ListMusic size={12} className="text-purple-400" />
                                                                    Playlists ({userDetails[u.uid].playlists.length})
                                                                </h4>
                                                                {userDetails[u.uid].playlists.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].playlists.map((playlist) => (
                                                                            <div key={playlist.id} className="flex items-center justify-between p-2 bg-[var(--background)] rounded-lg">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{playlist.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)]">{playlist.songs?.length || 0} songs</p>
                                                                                </div>
                                                                                {playlist.isPublic ? (
                                                                                    <Globe size={10} className="text-green-400" />
                                                                                ) : (
                                                                                    <LockIcon size={10} className="text-zinc-400" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No playlists created</p>
                                                                )}
                                                            </div>

                                                            {/* Recent Play History */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                                                    <Clock size={12} className="text-cyan-400" />
                                                                    Recent Plays ({userDetails[u.uid].playHistory.length})
                                                                </h4>
                                                                {userDetails[u.uid].playHistory.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {userDetails[u.uid].playHistory.slice(0, 5).map((song) => (
                                                                            <div key={song.id} className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg">
                                                                                <img src={song.image} className="w-8 h-8 rounded" alt="" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-medium text-[var(--foreground)] truncate">{song.name}</p>
                                                                                    <p className="text-[8px] text-[var(--foreground-muted)] truncate">{song.artist}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {userDetails[u.uid].playHistory.length > 5 && (
                                                                            <p className="text-[8px] text-[var(--foreground-muted)] text-center pt-1">
                                                                                +{userDetails[u.uid].playHistory.length - 5} more
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] text-[var(--foreground-muted)] italic">No play history</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}`;

if (tierRowEndMarker.test(content)) {
    content = content.replace(tierRowEndMarker, (match) => `${match}${expansionUI}`);
    console.log('✅ Found Tier row and added Expansion UI');
} else {
    console.log('❌ Could not find Tier row marker with regex');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated content length:', content.length);

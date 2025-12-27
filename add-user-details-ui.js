const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add Eye button to view user details (after the Trash2 button)
const trashButtonEnd = `                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>`;

const withEyeButton = `                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>`;

content = content.replace(trashButtonEnd, withEyeButton);

// Add user details expansion section (after the tier selector row)
const tierSelectorEnd = `                                            </div>
                                        </div>
                                    </div>`;

const withUserDetails = `                                            </div>

                                            {/* User Details Expansion */}
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
                                            )}
                                        </div>
                                    </div>`;

content = content.replace(tierSelectorEnd, withUserDetails);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added user details expansion UI to admin page');

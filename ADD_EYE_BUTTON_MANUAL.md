# Manual Fix: Add Eye Button to Admin Panel

## Location
File: `client/src/app/admin/page.tsx`
Line: ~758 (after the Trash2 delete button)

## What to Add

Find this code (around line 751-759):
```tsx
                                                    <button
                                                        onClick={() => requestUserDeletion(u.uid, u.displayName || 'User')}
                                                        disabled={updating === u.uid || u.uid === user?.uid}
                                                        className="p-2 rounded-lg transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
```

Add this button RIGHT AFTER the `</button>` closing tag (before `</div>`):
```tsx
                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>
```

## Result
The final code should look like:
```tsx
                                                    <button
                                                        onClick={() => requestUserDeletion(u.uid, u.displayName || 'User')}
                                                        disabled={updating === u.uid || u.uid === user?.uid}
                                                        className="p-2 rounded-lg transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
```

## What This Does
- Adds a cyan "Eye" icon button next to the delete button
- Clicking it expands the user card to show:
  - Liked Songs
  - Playlists
  - Play History
- The icon changes to "ChevronUp" when expanded
- Clicking again collapses the details

## Note
All other functionality (fetch functions, user details state, expansion UI) has already been added to the file. You just need to add this one button to make it visible in the UI.

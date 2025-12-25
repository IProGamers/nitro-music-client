#!/usr/bin/env node
/**
 * This script adds the Playlists tab functionality to the admin panel
 * Run with: node add-playlists-tab.js
 */

const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');

// Read the current file
let content = fs.readFileSync(adminPagePath, 'utf8');

// 1. Add Playlists tab to navigation (after line ~405)
const tabsArrayOld = `{ id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'settings', label: 'My Tier', icon: Settings },`;

const tabsArrayNew = `{ id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'playlists', label: 'Playlists', icon: ListMusic },
                            { id: 'settings', label: 'My Tier', icon: Settings },`;

content = content.replace(tabsArrayOld, tabsArrayNew);

// 2. Add playlist functions after cancelDeleteModal (around line 324)
const functionsInsertPoint = `    // Cancel delete modal
    const cancelDeleteModal = () => {
        setShowDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingDeleteAction(null);
    };`;

const playlistFunctions = `    // Cancel delete modal
    const cancelDeleteModal = () => {
        setShowDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingDeleteAction(null);
    };

    // Fetch all playlists
    const fetchPlaylists = async () => {
        setLoadingPlaylists(true);
        setError(null);
        try {
            const playlistsRef = collection(db, 'playlists');
            const snapshot = await getDocs(playlistsRef);
            const playlistData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PlaylistData[];
            playlistData.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            setPlaylists(playlistData);
        } catch (err: any) {
            console.error('Error fetching playlists:', err);
            if (err.code === 'permission-denied') {
                setError('Permission denied. Please update Firestore security rules.');
            } else {
                setError(\`Failed to fetch playlists: \${err.message || 'Unknown error'}\`);
            }
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const requestPlaylistDeletion = (playlistId: string, playlistName: string) => {
        const randomQuestion = SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)];
        setSecurityQuestion(randomQuestion);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingPlaylistDelete({ playlistId, playlistName });
        setShowPlaylistDeleteModal(true);
    };

    const verifyAndDeletePlaylist = async () => {
        if (securityAnswer.trim().toLowerCase() !== 'veer') {
            setSecurityError('Incorrect answer. Access denied.');
            return;
        }

        if (!pendingPlaylistDelete) return;

        setShowPlaylistDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);

        const { playlistId } = pendingPlaylistDelete;
        setPendingPlaylistDelete(null);

        setUpdating(playlistId);
        setSuccess(null);
        setError(null);

        try {
            await deleteDoc(doc(db, 'playlists', playlistId));
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            setSuccess('Playlist deleted successfully');
        } catch (err: any) {
            console.error('Delete playlist error:', err);
            setError(\`Failed to delete playlist: \${err.message || 'Unknown error'}\`);
        } finally {
            setUpdating(null);
        }
    };

    const cancelPlaylistDeleteModal = () => {
        setShowPlaylistDeleteModal(false);
        setSecurityAnswer('');
        setSecurityError(null);
        setPendingPlaylistDelete(null);
    };`;

content = content.replace(functionsInsertPoint, playlistFunctions);

// 3. Add filteredPlaylists after filteredUsers
const filteredUsersEnd = `    // Filtered users
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );`;

const withFilteredPlaylists = `    // Filtered users
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtered playlists
    const filteredPlaylists = playlists.filter(p =>
        p.name?.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(playlistSearchQuery.toLowerCase())
    );`;

content = content.replace(filteredUsersEnd, withFilteredPlaylists);

// Write the updated content
fs.writeFileSync(adminPagePath, content, 'utf8');

console.log('✅ Successfully added playlist functions to admin page!');
console.log('⚠️  You still need to manually add the Playlists tab UI and modal.');
console.log('   See PLAYLIST_TAB_UI.txt for the UI code to add.');

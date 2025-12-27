const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add fetch user details function before stats calculation
const insertPoint = `    // Stats calculation`;

const fetchUserDetailsFunction = `    // Fetch user details (liked songs, playlists, history)
    const fetchUserDetails = async (userId) => {
        if (userDetails[userId] || loadingUserDetails === userId) return;
        
        setLoadingUserDetails(userId);
        try {
            // Fetch liked songs
            const likedSongsRef = collection(db, 'users', userId, 'likedSongs');
            const likedSnap = await getDocs(likedSongsRef);
            const likedSongs = likedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch user's playlists
            const playlistsQuery = query(collection(db, 'playlists'), where('ownerId', '==', userId));
            const playlistsSnap = await getDocs(playlistsQuery);
            const userPlaylists = playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch play history
            const historyRef = collection(db, 'users', userId, 'playHistory');
            const historyQuery = query(historyRef, orderBy('playedAt', 'desc'), limit(10));
            const historySnap = await getDocs(historyQuery);
            const playHistory = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setUserDetails(prev => ({
                ...prev,
                [userId]: { likedSongs, playlists: userPlaylists, playHistory }
            }));
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setLoadingUserDetails(null);
        }
    };

    // Toggle user expansion
    const toggleUserExpansion = (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
            fetchUserDetails(userId);
        }
    };

    // Stats calculation`;

content = content.replace(insertPoint, fetchUserDetailsFunction);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added user details fetch function to admin page');

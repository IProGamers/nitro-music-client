const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add filteredPlaylists after filteredUsers
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

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added filteredPlaylists variable');

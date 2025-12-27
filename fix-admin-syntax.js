const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the malformed line 92
content = content.replace(
    /const \[showPlaylistDeleteModal, setShowPlaylistDeleteModal\] = useState\(false\); \\r\\n\\r\\n    \/\/ User details expansion state\\r\\n    const \[expandedUserId, setExpandedUserId\] = useState<string \| null>\(null\);\\r\\n    const \[userDetails, setUserDetails\] = useState<{ \[key: string\]: { likedSongs: any\[\], playlists: any\[\], playHistory: any\[\] } }>\({}\);\\r\\n    const \[loadingUserDetails, setLoadingUserDetails\] = useState<string \| null>\(null\);/,
    `const [showPlaylistDeleteModal, setShowPlaylistDeleteModal] = useState(false);\r\n\r\n    // User details expansion state\r\n    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);\r\n    const [userDetails, setUserDetails] = useState<{ [key: string]: { likedSongs: any[], playlists: any[], playHistory: any[] } }>({});\r\n    const [loadingUserDetails, setLoadingUserDetails] = useState<string | null>(null);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed admin page syntax errors');

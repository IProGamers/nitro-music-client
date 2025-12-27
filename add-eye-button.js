const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the exact section
const oldButtons = `                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tier Selector Row */}`;

const newButtons = `                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserExpansion(u.uid)}
                                                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                        title="View user details"
                                                    >
                                                        {expandedUserId === u.uid ? <ChevronUp size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tier Selector Row */}`;

if (content.includes(oldButtons)) {
    content = content.replace(oldButtons, newButtons);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Added Eye button to admin panel');
} else {
    console.log('❌ Could not find the exact location to add the Eye button');
    console.log('Please manually add the Eye button after the Trash button');
}

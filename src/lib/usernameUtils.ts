/**
 * List of restricted/vulgar words that are not allowed in usernames.
 * Feel free to extend this list as needed.
 */
export const RESTRICTED_WORDS = [
    'admin',
    'administrator',
    'moderator',
    'staff',
    'support',
    'nitro',
    'official',
    'system',
    'root',
    'null',
    'undefined',
    'fuck',
    'shit',
    'piss',
    'dick',
    'pussy',
    'asshole',
    'bitch',
    'bastard',
    'cunt',
    'nigger',
    'faggot',
    'sex',
    'porn',
    'hentai',
    'gay',
    'lesbian',
    'nazi',
    'hitler',
    'suicide',
    'kill',
    'death',
    'rape',
    // Add more as needed
];

/**
 * Checks if a string contains any restricted words.
 * @param text The string to check
 * @returns boolean true if the string is restricted
 */
export const isRestricted = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return RESTRICTED_WORDS.some(word => lowerText.includes(word));
};

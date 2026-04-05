const { doubleCsrf } = require('csrf-csrf');

/**
 * Double CSRF Protection Configuration
 * Replaces deprecated 'csurf' with a modern, secure alternative.
 */
const { 
    doubleCsrfProtection, 
    generateToken 
} = doubleCsrf({
    getSecret: (req) => process.env.SESSION_SECRET || 'nodeengine_secret_development',
    cookieName: "__Host-ps-csrf",
    cookieOptions: {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getTokenFromRequest: (req) => req.body._csrf, // Replicating standard form behavior
});

module.exports = {
    doubleCsrfProtection,
    generateToken
};

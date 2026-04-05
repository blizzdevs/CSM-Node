const { doubleCsrf } = require('csrf-csrf');

// Simplified CSRF configuration for maximum stability
const {
    doubleCsrfProtection,
    generateToken,
} = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET || "nodeengine_super_stable_secret_123", // Must be a function
    cookieName: "psm.csrf",
    cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // Set to true in production
    },
    getTokenFromRequest: (req) => req.body._csrf || req.headers["x-csrf-token"],
});

module.exports = {
    doubleCsrfProtection,
    generateToken
};

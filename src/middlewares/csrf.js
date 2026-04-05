const crypto = require('crypto');

/**
 * Custom CSRF Middleware (WebEngine Style)
 * Simple, stable, and 1:1 with session-based token logic.
 */
const csrfMiddleware = {
    // Generate and share token with views
    generateToken: (req, res, next) => {
        if (!req.session.csrfToken) {
            req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        }
        res.locals.csrfToken = req.session.csrfToken;
        next();
    },

    // Verify token on POST requests
    verifyToken: (req, res, next) => {
        const clientToken = req.body._csrf || req.headers['x-csrf-token'];
        const sessionToken = req.session.csrfToken;

        if (!clientToken || clientToken !== sessionToken) {
            return res.status(403).render('pages/error', {
                title: 'Security Error',
                message: 'Invalid CSRF Token. Please refresh the page and try again.',
                page: 'error'
            });
        }
        next();
    }
};

module.exports = csrfMiddleware;

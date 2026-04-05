/**
 * server.js — NodeEngine CMS
 *
 * Entry point. Configura Express, middleware de seguridad,
 * sesiones, CSRF, template engine y rutas base.
 *
 * La única ruta registrada aquí es GET /. El resto se registra
 * en src/routes/index.js a medida que se implementan los módulos.
 */

'use strict';

require('dotenv').config();

const express      = require('express');
const path         = require('path');
const helmet       = require('helmet');
const hpp          = require('hpp');
const rateLimit    = require('express-rate-limit');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const { doubleCsrf } = require('csrf-csrf');
const winston      = require('winston');

const sessionConfig    = require('./src/config/session');
const accountRoutes    = require('./src/modules/account/account.routes');
const newsRoutes       = require('./src/modules/news/news.routes');
const usercpRoutes     = require('./src/modules/usercp/usercp.routes');
const apiRoutes        = require('./src/modules/api/api.routes');
const rankingsRoutes   = require('./src/modules/rankings/rankings.routes');
const downloadsRoutes  = require('./src/modules/downloads/downloads.routes');
const pagesRoutes      = require('./src/modules/pages/pages.routes');
const HomeController   = require('./src/modules/home/home.controller');
const castleSiegeController = require('./src/modules/castlesiege/castlesiege.controller');
const { startCron }   = require('./src/cron/cron');

// ── Logger (Winston) ──────────────────────────────────────────────────────────
const logger = require('./src/config/logger');

// ── Express init ──────────────────────────────────────────────────────────────
const app = express();

// ── Helmet (CSP estricto) ─────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // Desactivado temporalmente para iframe del editor
    crossOriginEmbedderPolicy: false,
    frameguard: false,
}));


// ── HTTP Parameter Pollution ───────────────────────────────────────────────────
app.use(hpp());

// ── Morgan → Winston ──────────────────────────────────────────────────────────
app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
}));

// ── Rate Limiting global (100 req / 15 min) ───────────────────────────────────
// Los límites específicos por ruta (login, registro) se definen en cada router.
const globalLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    limit:           100,
    standardHeaders: 'draft-7',
    legacyHeaders:   false,
    message:         'Too many requests from this IP, please try again later.',
});
app.use(globalLimiter);

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET));

// ── Sesión ────────────────────────────────────────────────────────────────────
app.use(session(sessionConfig));

// ── Template Engine (EJS) ─────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src/public')));

// ── Variables globales de template ───────────────────────────────────────────
// Disponibles en todos los .ejs como locals.user, locals.config, etc.
app.use((req, res, next) => {
    res.locals.user         = req.session.user || null;
    res.locals.isAdmin      = req.session.user?.isAdmin || false;
    res.locals.path         = req.path;
    res.locals.flashError   = req.session.flashError  || null;
    res.locals.flashSuccess = req.session.flashSuccess || null;
    delete req.session.flashError;
    delete req.session.flashSuccess;
    next();
});

// ── CSRF Protection (csrf-csrf) ───────────────────────────────────────────────
const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret:     () => process.env.SESSION_SECRET,
    cookieName:    'nodeengine.x-csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'Lax',
        secure:   process.env.NODE_ENV === 'production',
    },
    size:              64,
    ignoredMethods:    ['GET', 'HEAD', 'OPTIONS'],
    getTokenFromRequest: (req) => req.body._csrf,
});

app.use(doubleCsrfProtection);

// Exponer generateToken a los controllers para inyectarlo en templates
app.set('generateCsrfToken', generateToken);

// ── Rutas ────────────────────────────────────────────────────────────────────────────────
app.use('/',          accountRoutes);
app.use('/news',      newsRoutes);
app.use('/usercp',    usercpRoutes);
app.use('/rankings',  rankingsRoutes);
app.use('/downloads', downloadsRoutes);
app.use('/api',       apiRoutes);
app.use('/',          pagesRoutes);

app.get('/', HomeController.showHome);

// Castle Siege (no necesita router propio porque es readonly)
app.get('/castlesiege', castleSiegeController.showSiege);

// ── Iniciar Cron ─────────────────────────────────────────────────────────────────────────────
startCron();

// ── Error handling (captura todo) ────────────────────────────────────────────
app.use((err, req, res, next) => {
    // Error CSRF: token inválido o ausente
    if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
        logger.warn(`CSRF violation — IP: ${req.ip} — URL: ${req.originalUrl}`);
        return res.status(403).render('pages/error', {
            title:   'Forbidden',
            message: 'Invalid security token. Please refresh the page and try again.',
        });
    }

    logger.error(`${err.status || 500} — ${err.message} — ${req.originalUrl} — ${req.ip}`);

    res.status(err.status || 500).render('pages/error', {
        title:   'Error',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'An internal error occurred.',
    });
});

// ── Listen ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
    logger.info(`NodeEngine CMS running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`\n  NodeEngine CMS → http://localhost:${PORT}\n`);
});

module.exports = app;

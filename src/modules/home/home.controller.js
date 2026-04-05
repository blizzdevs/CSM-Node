/**
 * src/modules/home/home.controller.js
 *
 * Controller de la Home — 1:1 con modules/home.php de WebEngine
 *
 * WebEngine home.php muestra:
 * 1. Noticias: desde loadCache('news.cache') — hasta 7 noticias
 * 2. Top Level: desde LoadCacheData('rankings_level.cache') — hasta 10
 * 3. Top Guilds: desde LoadCacheData('rankings_guilds.cache') — hasta 10
 * 4. Sidebar: si !isLoggedIn() → formulario de login rápido
 *             si isLoggedIn()  → menú UserCP
 *
 * Aquí los caches son JSON generados por el cron master.
 * Si el archivo no existe → sección vacía (no es error).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const ServerInfoService = require('../serverinfo/serverinfo.service');

const CACHE_DIR = path.join(__dirname, '../../cache');

function readCache(filename) {
    try {
        const filePath = path.join(CACHE_DIR, filename);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

const HomeController = {
    showHome(req, res) {
        const generateToken = req.app.get('generateCsrfToken');

        // Equivalente a loadCache('news.cache') con límite de 7
        const newsCache     = readCache('news.json');
        const news          = Array.isArray(newsCache?.news) ? newsCache.news.slice(0, 7) : [];

        // Equivalente a LoadCacheData('rankings_level.cache') con límite de 10
        const levelCache  = readCache('rankings_level.json');
        const topLevel    = Array.isArray(levelCache?.rankings) ? levelCache.rankings.slice(0, 10) : [];

        const guildCache  = readCache('rankings_guilds.json');
        const topGuilds   = Array.isArray(guildCache?.rankings) ? guildCache.rankings.slice(0, 10) : [];

        // Server Info cache
        const serverInfo = ServerInfoService.getServerInfo();

        // CSRF token solo si el usuario NO está logueado (para el login sidebar)
        const csrfToken = !req.session.user ? generateToken(req, res) : null;

        res.render('pages/home', {
            title:      'Home | NodeEngine',
            news,
            topLevel,
            topGuilds,
            serverInfo,
            csrfToken,
        });
    },
};

module.exports = HomeController;

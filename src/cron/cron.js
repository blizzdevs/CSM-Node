/**
 * src/cron/cron.js
 *
 * Master Cron Job — 1:1 con class.cron.php de WebEngine
 *
 * Tareas que replica:
 *   - Actualizar caché de noticias         (cacheNews)
 *   - Actualizar caché de rankings (todos) (updateRankingCache)
 *   - Actualizar caché de downloads        (updateCache downloads)
 *   - Actualizar caché de noticias home    (primeras 7)
 *
 * Intervalos configurables via .env (en minutos).
 * WebEngine usa cron PHP estándar; aquí usamos setInterval en Node.
 */

'use strict';

const logger           = require('../config/logger');
const NewsService      = require('../modules/news/news.service');
const RankingsService  = require('../modules/rankings/rankings.service');
const DownloadsService = require('../modules/downloads/downloads.service');
const ServerInfoService = require('../modules/serverinfo/serverinfo.service');
const CastleSiegeService = require('../modules/castlesiege/castlesiege.service');

// Intervalos en ms (desde .env, defaults en minutos)
const RANKINGS_INTERVAL  = parseInt(process.env.CRON_RANKINGS_MINUTES  || '60') * 60 * 1000;
const NEWS_INTERVAL      = parseInt(process.env.CRON_NEWS_MINUTES       || '10') * 60 * 1000;
const DOWNLOADS_INTERVAL = parseInt(process.env.CRON_DOWNLOADS_MINUTES  || '60') * 60 * 1000;
const SERVERINFO_INTERVAL = 5 * 60 * 1000; // 5 minutos harcoded (como en WebEngine cron)

// ── Helpers ────────────────────────────────────────────────────────
async function runSafe(name, fn) {
    try {
        await fn();
        logger.info(`[CRON] ${name} OK`);
    } catch (err) {
        logger.error(`[CRON] ${name} FAILED: ${err.message}`);
    }
}

// ── Init: ejecutar inmediatamente al arrancar, luego en intervalo ──
function startCron() {

    // Rankings — actualizar todos al inicio
    runSafe('Rankings cache', () => RankingsService.updateAllCaches());
    setInterval(
        () => runSafe('Rankings cache', () => RankingsService.updateAllCaches()),
        RANKINGS_INTERVAL
    );

    // News cache — actualizar al inicio
    runSafe('News cache', () => NewsService.updateNewsCache());
    setInterval(
        () => runSafe('News cache', () => NewsService.updateNewsCache()),
        NEWS_INTERVAL
    );

    // Downloads cache — actualizar al inicio
    runSafe('Downloads cache', () => DownloadsService.updateCache());
    setInterval(
        () => runSafe('Downloads cache', () => DownloadsService.updateCache()),
        DOWNLOADS_INTERVAL
    );

    // Server Info cache
    runSafe('ServerInfo cache', () => ServerInfoService.updateServerInfo());
    setInterval(
        () => runSafe('ServerInfo cache', () => ServerInfoService.updateServerInfo()),
        SERVERINFO_INTERVAL
    );

    // Castle Siege cache
    runSafe('CastleSiege cache', () => CastleSiegeService.updateSiegeCache());
    setInterval(
        () => runSafe('CastleSiege cache', () => CastleSiegeService.updateSiegeCache()),
        RANKINGS_INTERVAL // Usa el mismo intervalo general, está bien para CS
    );

    logger.info(`[CRON] Started — Rankings: ${RANKINGS_INTERVAL/60000}min | News: ${NEWS_INTERVAL/60000}min | Downloads: ${DOWNLOADS_INTERVAL/60000}min | ServerInfo: 5min | CS: ${RANKINGS_INTERVAL/60000}min`);
}

module.exports = { startCron };

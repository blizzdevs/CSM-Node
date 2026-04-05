const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const RankingsService = require('../modules/rankings/rankings.service');
const winston = require('winston');

// Logger specifically for CRON
const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/cron.log' })
    ]
});

const CACHE_DIR = path.join(__dirname, '../cache');

/**
 * Rankings Cache Master Cron
 * Replicates WebEngine caching logic (1:1 Logic)
 */
async function generateRankingsCache() {
    try {
        console.log('[CRON] Starting Rankings Cache Generation...');
        
        // 1. Ensure Cache Directory exists
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }

        // 2. Fetch Data from Service
        const topCharacters = await RankingsService.getTopCharacters(100);
        const topGuilds = await RankingsService.getTopGuilds(10);
        const topPvP = await RankingsService.getTopPvP(10);

        // 3. Save to JSON
        const data = {
            last_update: new Date(),
            characters: topCharacters,
            guilds: topGuilds,
            pvp: topPvP
        };

        fs.writeFileSync(
            path.join(CACHE_DIR, 'rankings.json'),
            JSON.stringify(data, null, 2)
        );

        console.log('[CRON] Rankings Cache Update SUCCESS.');
        logger.info('Rankings cache updated successfully');
    } catch (error) {
        console.error('[CRON] Rankings Cache Update FAILED:', error);
        logger.error('CRON Error: ' + error.message);
    }
}

// Scheduled Task (Every 15 minutes by default)
// Format: * * * * *
cron.schedule('*/15 * * * *', generateRankingsCache);

// Run immediately on server start for first-time population
generateRankingsCache();

module.exports = { generateRankingsCache };

/**
 * src/modules/downloads/downloads.service.js
 * 1:1 con downloads.php de WebEngine
 *
 * WebEngine usa WEBENGINE_DOWNLOADS con:
 *   download_type: 1=Client, 2=Patch, 3=Tools
 *   download_title, download_description, download_size (GB), download_link
 *
 * En NodeEngine: cacheamos desde BD a downloads.json
 * y leemos desde el caché en el controller.
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const prisma = require('../../config/database');
const mu_data = require('../../config/mu_data');

const CACHE_DIR = path.join(__dirname, '../../cache');

function readDownloadsCache() {
    try {
        const f = path.join(CACHE_DIR, 'downloads.json');
        if (!fs.existsSync(f)) return null;
        return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch { return null; }
}

const DownloadsService = {

    // Replica loadCache('downloads.cache') + switch tipofilter
    getDownloads() {
        const cache = readDownloadsCache();
        if (!cache || !Array.isArray(cache.downloads)) {
            return { clients: [], patches: [], tools: [] };
        }
        const clients = [], patches = [], tools = [];
        for (const d of cache.downloads) {
            if (d.download_type === 1)      clients.push(d);
            else if (d.download_type === 2) patches.push(d);
            else if (d.download_type === 3) tools.push(d);
        }
        return { clients, patches, tools };
    },

    async updateCache() {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        try {
            const downloads = await prisma.$queryRawUnsafe(`
                SELECT download_id, download_title, download_description,
                       download_size, download_link, download_type
                FROM ${mu_data.CMS_DB}.${mu_data.TBL_CMS_DOWNLOADS}
                ORDER BY download_id DESC
            `);
            fs.writeFileSync(
                path.join(CACHE_DIR, 'downloads.json'),
                JSON.stringify({ downloads, last_update: Math.floor(Date.now() / 1000) }, null, 2),
                'utf8'
            );
        } catch (e) {
            fs.writeFileSync(
                path.join(CACHE_DIR, 'downloads.json'),
                JSON.stringify({ downloads: [], last_update: Math.floor(Date.now() / 1000) }, null, 2),
                'utf8'
            );
        }
    },
};

module.exports = DownloadsService;

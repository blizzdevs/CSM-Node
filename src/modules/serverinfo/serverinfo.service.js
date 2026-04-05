/**
 * src/modules/serverinfo/serverinfo.service.js
 *
 * 1:1 con includes/cron/server_info.php
 * Genera el caché de estadísticas generales del servidor:
 * - Cuentas Totales
 * - Personajes Totales
 * - Clanes Totales
 * - Usuarios Online
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const prisma = require('../../config/database');
const mu_data = require('../../config/mu_data');

const CACHE_DIR = path.join(__dirname, '../../cache');

function getServerInfo() {
    try {
        const filePath = path.join(CACHE_DIR, 'server_info.json');
        if (!fs.existsSync(filePath)) return { accounts: 0, characters: 0, guilds: 0, online: 0 };
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return { accounts: 0, characters: 0, guilds: 0, online: 0 };
    }
}

async function updateServerInfo() {
    try {
        // Cuentas totales
        const accCountRow = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${mu_data.TBL_ACCOUNT}`);
        const accCount = Number(accCountRow[0].count);
        
        // Personajes totales
        const chrCountRow = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${mu_data.TBL_CHARACTER}`);
        const chrCount = Number(chrCountRow[0].count);
        
        // Guilds totales
        const gldCountRow = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${mu_data.TBL_GUILD}`);
        const gldCount = Number(gldCountRow[0].count);
        
        // Cuentas online
        const onlCountRow = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${mu_data.TBL_ACCOUNT_STAT} WHERE ${mu_data.CLMN_CONNSTAT ?? 'ConnectStat'} = 1`);
        const onlCount = Number(onlCountRow[0].count);

        const data = {
            accounts: accCount,
            characters: chrCount,
            guilds: gldCount,
            online: onlCount,
            last_update: Math.floor(Date.now() / 1000)
        };

        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(path.join(CACHE_DIR, 'server_info.json'), JSON.stringify(data, null, 2), 'utf8');

        return data;
    } catch (e) {
        // Fallback
        return { accounts: 0, characters: 0, guilds: 0, online: 0 };
    }
}

module.exports = {
    getServerInfo,
    updateServerInfo
};

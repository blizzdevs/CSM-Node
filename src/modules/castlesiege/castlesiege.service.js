/**
 * src/modules/castlesiege/castlesiege.service.js
 *
 * Servicio de Castle Siege — 1:1 con class.castlesiege.php de WebEngine
 * Extrae la alianza dueña del castillo de MuCastle_DATA y los datos de la Guild.
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const prisma = require('../../config/database');
const mu_data = require('../../config/mu_data');

const CACHE_DIR = path.join(__dirname, '../../cache');

const CastleSiegeService = {
    // ── Leer el caché ──────────────────────────────────────────────
    getSiegeData() {
        try {
            const filePath = path.join(CACHE_DIR, 'castlesiege.json');
            if (!fs.existsSync(filePath)) return null;
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            return null;
        }
    },

    // ── Actualizar Caché (Cron) ────────────────────────────────────
    async updateSiegeCache() {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

        try {
            // Obtener info principal del castillo (OWNER_GUILD, MONEY)
            const castleData = await prisma.$queryRawUnsafe(`
                SELECT TOP 1 
                    ${mu_data.CLMN_MCD_OCCUPY ?? 'CASTLE_OCCUPY'} AS CASTLE_OCCUPY, 
                    ${mu_data.CLMN_MCD_GUILD_OWNER ?? 'OWNER_GUILD'} AS OWNER_GUILD, 
                    ${mu_data.CLMN_MCD_MONEY ?? 'MONEY'} AS MONEY, 
                    ${mu_data.CLMN_MCD_TRC ?? 'TAX_RATE_CHAOS'} AS TAX_RATE_CHAOS, 
                    ${mu_data.CLMN_MCD_TRS ?? 'TAX_RATE_STORE'} AS TAX_RATE_STORE
                FROM ${mu_data.TBL_CASTLE_DATA}
            `);

            let ownerGuild = null;

            // Si hay un dueño (CASTLE_OCCUPY true/1 y OWNER_GUILD válido)
            if (castleData.length > 0 && (castleData[0].CASTLE_OCCUPY === 1 || castleData[0].CASTLE_OCCUPY === true) && castleData[0].OWNER_GUILD) {
                const guildName = castleData[0].OWNER_GUILD;
                
                // Buscar score y logo de la guild dueña
                const guildData = await prisma.$queryRawUnsafe(`
                    SELECT 
                        ${mu_data.CLMN_GUILD_NAME} AS G_Name, 
                        ${mu_data.CLMN_GUILD_MASTER} AS G_Master, 
                        ${mu_data.CLMN_GUILD_SCORE} AS G_Score, 
                        CONVERT(varchar(max), ${mu_data.CLMN_GUILD_MARK ?? 'G_Mark'}, 2) AS G_Mark
                    FROM ${mu_data.TBL_GUILD}
                    WHERE ${mu_data.CLMN_GUILD_NAME} = '${guildName}'
                `);
                
                if (guildData.length > 0) {
                    ownerGuild = guildData[0];
                }
            }

            const payload = {
                castleInfo: castleData.length > 0 ? castleData[0] : null,
                ownerGuild: ownerGuild,
                last_update: Math.floor(Date.now() / 1000)
            };

            fs.writeFileSync(
                path.join(CACHE_DIR, 'castlesiege.json'),
                JSON.stringify(payload, null, 2),
                'utf8'
            );

        } catch (e) {
            // Tabla ausente o esquema diferente (MuCastle_DATA no existe)
            fs.writeFileSync(
                path.join(CACHE_DIR, 'castlesiege.json'),
                JSON.stringify({ castleInfo: null, ownerGuild: null }, null, 2),
                'utf8'
            );
        }
    }
};

module.exports = CastleSiegeService;

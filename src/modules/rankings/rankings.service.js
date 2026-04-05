/**
 * src/modules/rankings/rankings.service.js
 *
 * Módulo de Rankings — 1:1 con WebEngine (class.rankings.php).
 * AHORA UTILIZANDO mu_data.js para adaptabilidad dinámica de Base de Datos.
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const prisma = require('../../config/database');
const mu_data = require('../../config/mu_data');

const CACHE_DIR = path.join(__dirname, '../../cache');

// Configuración leída de WebEngine / .env
const RESULTS = parseInt(process.env.RANKINGS_RESULTS || '25', 10);
const EXCLUDED_CHARS = (process.env.RANKINGS_EXCLUDED_CHARACTERS || '').split(',').map(s => s.trim()).filter(Boolean);
const EXCLUDED_GUILDS = (process.env.RANKINGS_EXCLUDED_GUILDS || '').split(',').map(s => s.trim()).filter(Boolean);

function writeCache(filename, data) {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const payload = {
        rankings: data,
        last_update: Math.floor(Date.now() / 1000)
    };
    fs.writeFileSync(path.join(CACHE_DIR, filename), JSON.stringify(payload, null, 2), 'utf8');
}

function readCache(filename) {
    try {
        const f = path.join(CACHE_DIR, filename);
        if (!fs.existsSync(f)) return null;
        return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch { return null; }
}

const RANKINGS_MENU = [
    { label: 'Level',       slug: 'level'       },
    { label: 'Resets',      slug: 'resets'      },
    { label: 'Killers',     slug: 'killers'     },
    { label: 'Guilds',      slug: 'guilds'      },
    { label: 'Grand Resets',slug: 'grandresets' },
    { label: 'Master Level',slug: 'master'      },
    { label: 'Online',      slug: 'online'      },
    { label: 'Gens',        slug: 'gens'        },
    { label: 'Votes',       slug: 'votes'       },
];

const RankingsService = {

    getMenu() { return RANKINGS_MENU; },
    getCached(type) { return readCache(`rankings_${type}.json`); },

    // ── Utilidades para query dinámica ──
    getExcludedCondition(colName, arr) {
        if (!arr || arr.length === 0) return `1=1`;
        return `${colName} NOT IN (${arr.map(a => `'${a}'`).join(',')})`;
    },

    // ── Level Ranking ─────────────────────────────────────────────
    async updateLevel() {
        try {
            const excluded = this.getExcludedCondition(mu_data.CLMN_CHR_NAME, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_CHR_NAME} AS Name, 
                    ${mu_data.CLMN_CHR_CLASS} AS Class, 
                    ${mu_data.CLMN_CHR_CLEVEL} AS cLevel, 
                    ${mu_data.CLMN_CHR_RESETS} AS ResetCount, 
                    ${mu_data.CLMN_CHR_MAP} AS Map
                FROM ${mu_data.TBL_CHARACTER}
                WHERE ${excluded}
                ORDER BY ${mu_data.CLMN_CHR_CLEVEL} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_level.json', result);
        } catch(e) {}
    },

    // ── Resets Ranking ────────────────────────────────────────────
    async updateResets() {
        try {
            const excluded = this.getExcludedCondition(mu_data.CLMN_CHR_NAME, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_CHR_NAME} AS Name, 
                    ${mu_data.CLMN_CHR_CLASS} AS Class, 
                    ${mu_data.CLMN_CHR_RESETS} AS ResetCount, 
                    ${mu_data.CLMN_CHR_CLEVEL} AS cLevel, 
                    ${mu_data.CLMN_CHR_MAP} AS Map
                FROM ${mu_data.TBL_CHARACTER}
                WHERE ${excluded} AND ${mu_data.CLMN_CHR_RESETS} > 0
                ORDER BY ${mu_data.CLMN_CHR_RESETS} DESC, ${mu_data.CLMN_CHR_CLEVEL} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_resets.json', result);
        } catch(e) {}
    },

    // ── Killers Ranking ───────────────────────────────────────────
    async updateKillers() {
        try {
            const excluded = this.getExcludedCondition(mu_data.CLMN_CHR_NAME, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_CHR_NAME} AS Name, 
                    ${mu_data.CLMN_CHR_CLASS} AS Class, 
                    ${mu_data.CLMN_CHR_PK} AS PkCount, 
                    ${mu_data.CLMN_CHR_CLEVEL} AS cLevel, 
                    ${mu_data.CLMN_CHR_MAP} AS Map, 
                    ${mu_data.CLMN_CHR_PK_LEVEL} AS PkLevel
                FROM ${mu_data.TBL_CHARACTER}
                WHERE ${excluded} AND ${mu_data.CLMN_CHR_PK} > 0
                ORDER BY ${mu_data.CLMN_CHR_PK} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_killers.json', result);
        } catch(e) {}
    },

    // ── Guilds Ranking ────────────────────────────────────────────
    async updateGuilds() {
        try {
            const excluded = this.getExcludedCondition(mu_data.CLMN_GUILD_NAME, EXCLUDED_GUILDS);
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_GUILD_NAME} AS G_Name, 
                    ${mu_data.CLMN_GUILD_MASTER} AS G_Master, 
                    ${mu_data.CLMN_GUILD_SCORE} AS G_Score
                FROM ${mu_data.TBL_GUILD}
                WHERE ${excluded}
                ORDER BY ${mu_data.CLMN_GUILD_SCORE} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_guilds.json', result);
        } catch(e) {}
    },

    // ── Grand Resets Ranking ──────────────────────────────────────
    async updateGrandResets() {
        try {
            const excluded = this.getExcludedCondition(mu_data.CLMN_CHR_NAME, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_CHR_NAME} AS Name, 
                    ${mu_data.CLMN_CHR_GRSTS} AS GrandResetCount, 
                    ${mu_data.CLMN_CHR_RESETS} AS ResetCount, 
                    ${mu_data.CLMN_CHR_CLASS} AS Class, 
                    ${mu_data.CLMN_CHR_MAP} AS Map
                FROM ${mu_data.TBL_CHARACTER}
                WHERE ${excluded} AND ${mu_data.CLMN_CHR_GRSTS} >= 1
                ORDER BY ${mu_data.CLMN_CHR_GRSTS} DESC, ${mu_data.CLMN_CHR_RESETS} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_grandresets.json', result);
        } catch(e) {}
    },

    // ── Master Level Ranking (JOIN de MasterSkillTree) ────────────
    async updateMasterLevel() {
        try {
            const excluded = this.getExcludedCondition(`C.${mu_data.CLMN_CHR_NAME}`, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    C.${mu_data.CLMN_CHR_NAME} AS Name, 
                    C.${mu_data.CLMN_CHR_CLASS} AS Class, 
                    C.${mu_data.CLMN_CHR_CLEVEL} AS cLevel, 
                    ISNULL(M.${mu_data.CLMN_ML_LEVEL}, 0) AS mLevel, 
                    (C.${mu_data.CLMN_CHR_CLEVEL} + ISNULL(M.${mu_data.CLMN_ML_LEVEL}, 0)) AS MasterLevel, 
                    C.${mu_data.CLMN_CHR_MAP} AS Map
                FROM ${mu_data.TBL_CHARACTER} C
                LEFT JOIN ${mu_data.TBL_MASTERLEVEL} M ON C.${mu_data.CLMN_CHR_NAME} = M.${mu_data.CLMN_ML_NAME}
                WHERE ${excluded}
                ORDER BY (C.${mu_data.CLMN_CHR_CLEVEL} + ISNULL(M.${mu_data.CLMN_ML_LEVEL}, 0)) DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_master.json', result);
        } catch(e) {}
    },

    // ── Online Ranking ────────────────────────────────────────────
    async updateOnline() {
        try {
            // Nota: Esta query asume el diseño TBL_ACCOUNT_STAT y GameIDC, que casi no cambian.
            const query = `
                SELECT TOP ${RESULTS}
                    C.${mu_data.CLMN_CHR_NAME} AS Name, 
                    C.${mu_data.CLMN_CHR_CLASS} AS Class, 
                    C.${mu_data.CLMN_CHR_MAP} AS Map, 
                    S.OnlineHours
                FROM ${mu_data.TBL_ACCOUNT_STAT} S
                JOIN AccountCharacter A ON S.memb___id = A.Id
                JOIN ${mu_data.TBL_CHARACTER} C ON A.GameIDC = C.${mu_data.CLMN_CHR_NAME}
                WHERE S.OnlineHours > 0
                ORDER BY S.OnlineHours DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_online.json', result);
        } catch(e) {}
    },

    // ── Gens Ranking ──────────────────────────────────────────────
    async updateGens() {
        try {
            const excluded = this.getExcludedCondition(`G.${mu_data.CLMN_GENS_NAME}`, EXCLUDED_CHARS);
            const query = `
                SELECT TOP ${RESULTS}
                    G.${mu_data.CLMN_GENS_NAME} AS Name, 
                    G.${mu_data.CLMN_GENS_FAMILY} AS Family, 
                    G.${mu_data.CLMN_GENS_CONTRIB} AS Contribution, 
                    C.${mu_data.CLMN_CHR_CLASS} AS Class, 
                    C.${mu_data.CLMN_CHR_MAP} AS Map
                FROM ${mu_data.TBL_GENS} G
                JOIN ${mu_data.TBL_CHARACTER} C ON G.${mu_data.CLMN_GENS_NAME} = C.${mu_data.CLMN_CHR_NAME}
                WHERE ${excluded}
                ORDER BY G.${mu_data.CLMN_GENS_CONTRIB} DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_gens.json', result);
        } catch(e) {}
    },

    // ── Votes Ranking (Desde Me_MuOnline CMS) ─────────────────────
    async updateVotes() {
        try {
            const query = `
                SELECT TOP ${RESULTS}
                    ${mu_data.CLMN_CMS_VOTE_USER} AS Name, COUNT(*) AS TotalVotes
                FROM ${mu_data.CMS_DB}.${mu_data.TBL_CMS_VOTES}
                GROUP BY ${mu_data.CLMN_CMS_VOTE_USER}
                ORDER BY TotalVotes DESC
            `;
            const result = await prisma.$queryRawUnsafe(query);
            writeCache('rankings_votes.json', result);
        } catch(e) {}
    },

    async updateAllCaches() {
        await Promise.allSettled([
            this.updateLevel(), this.updateResets(), this.updateKillers(),
            this.updateGuilds(), this.updateGrandResets(), this.updateMasterLevel(),
            this.updateOnline(), this.updateGens(), this.updateVotes(),
        ]);
    },
};

module.exports = RankingsService;

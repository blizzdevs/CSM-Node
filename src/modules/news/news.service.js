/**
 * src/modules/news/news.service.js
 *
 * Servicio de Noticias — 1:1 con class.news.php de WebEngine
 *
 * WebEngine almacena noticias en WEBENGINE_NEWS:
 *   - news_title:   base64_encode del título
 *   - news_content: base64_encode del contenido HTML
 *   - news_author:  string
 *   - news_date:    Unix timestamp (time())
 *
 * El sistema de caché JSON replica loadCache('news.cache') y
 * LoadCachedNews() — los archivos físicos se reemplazan por JSON.
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const prisma = require('../../config/database');
const mu_data = require('../../config/mu_data');

const CACHE_DIR  = path.join(__dirname, '../../cache');
const NEWS_LIMIT = 15; // mconfig('news_list_limit') — configurable

// ── Helpers de caché (replica loadCache / updateCacheFile) ───────

function readNewsCache() {
    try {
        const f = path.join(CACHE_DIR, 'news.json');
        if (!fs.existsSync(f)) return null;
        return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch { return null; }
}

function writeNewsCache(data) {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, 'news.json'), JSON.stringify(data, null, 2), 'utf8');
}

// ── Service ──────────────────────────────────────────────────────

const NewsService = {

    /**
     * getNewsList — replica news.php: loadCache('news.cache') filtrado
     * Devuelve hasta NEWS_LIMIT noticias del caché.
     */
    getNewsList(limit = NEWS_LIMIT) {
        const cache = readNewsCache();
        if (!cache || !Array.isArray(cache.news)) return [];
        return cache.news.slice(0, limit).map(n => ({
            news_id:      n.news_id,
            news_title:   Buffer.from(n.news_title, 'base64').toString('utf8'),
            news_content: Buffer.from(n.news_content, 'base64').toString('utf8'),
            news_author:  n.news_author,
            news_date:    n.news_date,
        }));
    },

    /**
     * getNewsById — replica: if($News->newsIdExists($id)) en news.php
     */
    getNewsById(id) {
        const cache = readNewsCache();
        if (!cache || !Array.isArray(cache.news)) return null;
        const found = cache.news.find(n => n.news_id == id);
        if (!found) return null;
        return {
            news_id:      found.news_id,
            news_title:   Buffer.from(found.news_title, 'base64').toString('utf8'),
            news_content: Buffer.from(found.news_content, 'base64').toString('utf8'),
            news_author:  found.news_author,
            news_date:    found.news_date,
        };
    },

    /**
     * newsIdExists — replica newsIdExists() de class.news.php
     */
    newsIdExists(id) {
        const cache = readNewsCache();
        if (!cache || !Array.isArray(cache.news)) return false;
        return cache.news.some(n => n.news_id == id);
    },

    /**
     * updateNewsCache — replica updateNewsCacheIndex()
     * Escribe el caché JSON desde la BD. Se llama desde el cron.
     */
    async updateNewsCache() {
        if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

        try {
            const news = await prisma.$queryRawUnsafe(`
                SELECT news_id, news_title, news_author, news_date, news_content, allow_comments
                FROM ${mu_data.CMS_DB}.${mu_data.TBL_CMS_NEWS}
                ORDER BY news_id DESC
            `);
            writeNewsCache({ news, last_update: Math.floor(Date.now() / 1000) });
        } catch (e) {
            writeNewsCache({ news: [], last_update: Math.floor(Date.now() / 1000) });
        }
        return true;
    },

    /**
     * addNews — replica addNews() de class.news.php
     * Título y contenido se guardan en base64.
     */
    async addNews({ title, content, author = 'Administrator', allowComments = 1 }) {
        if (!title || title.length < 4 || title.length > 255)
            throw new Error('Invalid news title (4–255 characters).');
        if (!content || content.length < 4)
            throw new Error('Invalid news content (minimum 4 characters).');

        const comments = (allowComments < 0 || allowComments > 1) ? 1 : allowComments;

        await prisma.$executeRaw`
            INSERT INTO WEBENGINE_NEWS (news_title, news_author, news_date, news_content, allow_comments)
            VALUES (
                ${Buffer.from(title).toString('base64')},
                ${author},
                ${Math.floor(Date.now() / 1000)},
                ${Buffer.from(content).toString('base64')},
                ${comments}
            )
        `;

        await this.updateNewsCache();
    },

    /**
     * removeNews — replica removeNews() de class.news.php
     */
    async removeNews(id) {
        if (!id || isNaN(id)) throw new Error('Invalid news ID.');
        if (!this.newsIdExists(id)) throw new Error('News article not found.');

        await prisma.$executeRaw`DELETE FROM WEBENGINE_NEWS WHERE news_id = ${parseInt(id)}`;
        await this.updateNewsCache();
    },

    /**
     * editNews — replica editNews() de class.news.php
     */
    async editNews({ id, title, content, author, allowComments, date }) {
        if (!this.newsIdExists(id)) throw new Error('News article not found.');
        if (!title || title.length < 4 || title.length > 255)
            throw new Error('Invalid news title (4–255 characters).');
        if (!content || content.length < 4)
            throw new Error('Invalid news content.');

        const ts = date ? Math.floor(new Date(date).getTime() / 1000) : Math.floor(Date.now() / 1000);

        await prisma.$executeRaw`
            UPDATE WEBENGINE_NEWS
            SET news_title   = ${Buffer.from(title).toString('base64')},
                news_content = ${Buffer.from(content).toString('base64')},
                news_author  = ${author},
                news_date    = ${ts},
                allow_comments = ${allowComments}
            WHERE news_id = ${parseInt(id)}
        `;

        await this.updateNewsCache();
    },
};

module.exports = NewsService;

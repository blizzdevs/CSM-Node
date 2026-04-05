/**
 * src/config/app.js
 *
 * Configuración Global — NodeEngine CMS
 *
 * Equivalente a config.php de WebEngine.
 * Toda la lógica de negocio que depende de estos valores
 * debe importar este módulo, no leer process.env directamente.
 *
 * Clase S6E3 máxima: Rage Fighter (class_id 96-99).
 * No existe Grow Lancer, Slayer ni Rune Mage en S6E3.
 */

'use strict';

const config = {
    // ── Servidor ─────────────────────────────────────────────────────────────
    siteName:    'NodeEngine CMS',
    siteUrl:      process.env.SITE_URL || 'http://localhost:3001',
    env:          process.env.NODE_ENV || 'development',

    // ── Encriptación (1:1 con WebEngine _passwordEncryption) ─────────────────
    // phpmd5 = md5(password)
    // sha256 = sha256(password + username + salt)
    // wzmd5  = fn_md5 stored procedure en SQL Server
    encryption: {
        method: process.env.ENCRYPTION_METHOD || 'phpmd5',
        sha256Salt: process.env.SHA256_SALT || '',
    },

    // ── Límites de cuenta (equiv. config.php: username_min_len etc.) ──────────
    character: {
        maxLevel:           400,   // Nivel máximo S6E3
        maxStats:           32767, // Máximo por stat (SmallInt SQL Server)
        maxResets:          9999,
        defaultSerial:      '1111111111111', // sno__numb por defecto al registrar
        statPointsPerLevel: 5,
        usernameMinLen:     4,     // WebEngine: username_min_len
        usernameMaxLen:     10,    // WebEngine: username_max_len
        passwordMinLen:     4,     // WebEngine: password_min_len
        passwordMaxLen:     12,    // WebEngine: password_max_len
    },

    // ── Clases de personaje S6E3 y anteriores ────────────────────────────────
    // Source: WebEngine xteam.tables.php $custom['character_class']
    // key = Class (TinyInt en DB), value = { name, abbr, classGroup }
    // classGroup = ID del clase base (para filtros de ranking y addstats)
    characterClasses: {
        0:   { name: 'Dark Wizard',     abbr: 'DW',  classGroup: 0  },
        1:   { name: 'Soul Master',     abbr: 'SM',  classGroup: 0  },
        2:   { name: 'Grand Master',    abbr: 'GM',  classGroup: 0  },
        3:   { name: 'Grand Master',    abbr: 'GM',  classGroup: 0  },
        7:   { name: 'Soul Wizard',     abbr: 'SW',  classGroup: 0  },
        16:  { name: 'Dark Knight',     abbr: 'DK',  classGroup: 16 },
        17:  { name: 'Blade Knight',    abbr: 'BK',  classGroup: 16 },
        18:  { name: 'Blade Master',    abbr: 'BM',  classGroup: 16 },
        19:  { name: 'Blade Master',    abbr: 'BM',  classGroup: 16 },
        23:  { name: 'Dragon Knight',   abbr: 'DGK', classGroup: 16 },
        32:  { name: 'Fairy Elf',       abbr: 'ELF', classGroup: 32 },
        33:  { name: 'Muse Elf',        abbr: 'ME',  classGroup: 32 },
        34:  { name: 'High Elf',        abbr: 'HE',  classGroup: 32 },
        35:  { name: 'High Elf',        abbr: 'HE',  classGroup: 32 },
        39:  { name: 'Noble Elf',       abbr: 'NE',  classGroup: 32 },
        48:  { name: 'Magic Gladiator', abbr: 'MG',  classGroup: 48 },
        49:  { name: 'Duel Master',     abbr: 'DM',  classGroup: 48 },
        50:  { name: 'Duel Master',     abbr: 'DM',  classGroup: 48 },
        54:  { name: 'Magic Knight',    abbr: 'MK',  classGroup: 48 },
        64:  { name: 'Dark Lord',       abbr: 'DL',  classGroup: 64 },
        65:  { name: 'Lord Emperor',    abbr: 'LE',  classGroup: 64 },
        66:  { name: 'Lord Emperor',    abbr: 'LE',  classGroup: 64 },
        67:  { name: 'Empire Lord',     abbr: 'EL',  classGroup: 64 },
        80:  { name: 'Summoner',        abbr: 'SUM', classGroup: 80 },
        81:  { name: 'Bloody Summoner', abbr: 'BS',  classGroup: 80 },
        82:  { name: 'Dimension Master',abbr: 'DSM', classGroup: 80 },
        83:  { name: 'Dimension Master',abbr: 'DSM', classGroup: 80 },
        87:  { name: 'Dimension Summoner', abbr: 'DS', classGroup: 80 },
        96:  { name: 'Rage Fighter',    abbr: 'RF',  classGroup: 96 },
        97:  { name: 'Fist Master',     abbr: 'FM',  classGroup: 96 },
        98:  { name: 'Fist Master',     abbr: 'FM',  classGroup: 96 },
        99:  { name: 'Fist Blazer',     abbr: 'FB',  classGroup: 96 },
        102: { name: 'Fist Blazer',     abbr: 'FB',  classGroup: 96 },
    },

    // ── Clases que usan el stat Command ──────────────────────────────────────
    // Source: WebEngine xteam.tables.php $custom['character_cmd']
    classesWithCommand: [64, 65, 66, 67],

    // ── Stats base por clase S6E3 ─────────────────────────────────────────────
    // Source: xteam.tables.php base_stats
    classBaseStats: {
        0:   { str: 18, agi: 18, vit: 15, ene: 30, cmd: 0 },
        16:  { str: 28, agi: 20, vit: 25, ene: 10, cmd: 0 },
        32:  { str: 22, agi: 25, vit: 15, ene: 20, cmd: 0 },
        48:  { str: 26, agi: 26, vit: 26, ene: 16, cmd: 0 },
        64:  { str: 26, agi: 20, vit: 20, ene: 15, cmd: 25 },
        80:  { str: 21, agi: 21, vit: 18, ene: 23, cmd: 0 },
        96:  { str: 32, agi: 27, vit: 25, ene: 20, cmd: 0 },
    },

    // ── Mapas de juego S6E3 ───────────────────────────────────────────────────
    // Source: xteam.tables.php $custom['map_list'] (solo hasta S6E3)
    maps: {
        0:  'Lorencia',      1:  'Dungeon',       2:  'Devias',
        3:  'Noria',         4:  'Lost Tower',    6:  'Arena',
        7:  'Atlans',        8:  'Tarkan',         9:  'Devil Square',
        10: 'Icarus',        11: 'Blood Castle',  18: 'Chaos Castle',
        24: 'Kalima 1',      25: 'Kalima 2',      26: 'Kalima 3',
        27: 'Kalima 4',      28: 'Kalima 5',      29: 'Kalima 6',
        30: 'Valley of Loren', 31: 'Land of Trials', 33: 'Aida',
        34: 'Crywolf Fortress', 36: 'Kalima 7',   37: 'Kanturu',
        51: 'Elbeland',      56: 'Swamp of Calmness', 57: 'Raklion',
        64: 'Duel Arena',    80: 'Karutan 1',     81: 'Karutan 2',
    },

    // ── Niveles de PK ─────────────────────────────────────────────────────────
    // Source: xteam.tables.php $custom['pk_level']
    pkLevels: {
        0: 'Normal',   1: 'Hero',     2: 'Hero',
        3: 'Commoner', 4: 'Warning',  5: 'Murder',  6: 'Outlaw',
    },

    // ── Sistema de Gens ───────────────────────────────────────────────────────
    gensTypes: { 0: 'Duprian', 1: 'Vanert' },
    gensRanks: [
        { min: 10000, name: 'Knight' },
        { min: 6000,  name: 'Guard' },
        { min: 3000,  name: 'Officer' },
        { min: 1500,  name: 'Lieutenant' },
        { min: 500,   name: 'Sergeant' },
        { min: 0,     name: 'Private' },
    ],

    // ── Tablas del CMS (WebEngine propias — Me_MuOnline) ─────────────────────
    // Source: webengine.tables.php
    cmsTables: {
        news:              'WEBENGINE_NEWS',
        newsTranslations:  'WEBENGINE_NEWS_TRANSLATIONS',
        bans:              'WEBENGINE_BANS',
        banLog:            'WEBENGINE_BAN_LOG',
        blockedIp:         'WEBENGINE_BLOCKED_IP',
        creditsConfig:     'WEBENGINE_CREDITS_CONFIG',
        creditsLogs:       'WEBENGINE_CREDITS_LOGS',
        cron:              'WEBENGINE_CRON',
        downloads:         'WEBENGINE_DOWNLOADS',
        fla:               'WEBENGINE_FLA',
        passchangeRequest: 'WEBENGINE_PASSCHANGE_REQUEST',
        paypalTx:          'WEBENGINE_PAYPAL_TRANSACTIONS',
        plugins:           'WEBENGINE_PLUGINS',
        registerAccount:   'WEBENGINE_REGISTER_ACCOUNT',
        votes:             'WEBENGINE_VOTES',
        voteLogs:          'WEBENGINE_VOTE_LOGS',
        voteSites:         'WEBENGINE_VOTE_SITES',
        accountCountry:    'WEBENGINE_ACCOUNT_COUNTRY',
    },
};

/**
 * Obtiene el nombre y abreviatura de una clase por su ID.
 * Retorna { name, abbr, classGroup } o null si no existe.
 */
config.getCharacterClass = function (classId) {
    return config.characterClasses[classId] || null;
};

/**
 * Obtiene el nombre de un mapa por su número.
 * Retorna el nombre o 'Unknown Map'.
 */
config.getMapName = function (mapNumber) {
    return config.maps[mapNumber] || 'Unknown Map';
};

/**
 * Obtiene el nombre del nivel PK.
 * Retorna el label o 'Unknown'.
 */
config.getPkLevelName = function (pkLevel) {
    return config.pkLevels[pkLevel] || 'Unknown';
};

module.exports = config;

/**
 * src/config/mu_data.js
 *
 * Mapeo de Tablas y Columnas de juego.
 * Centraliza la definición estructural de la base de datos de juego (MuOnline)
 * para lograr adaptabilidad total sin importar la Season (S6, S8, S9) o los Server Files.
 *
 * Equivalente a: includes/config/custom.tables.php (WebEngine CMS)
 */

'use strict';

module.exports = {
    // ────────────── TABLES ──────────────
    TBL_ACCOUNT:        'MEMB_INFO',
    TBL_ACCOUNT_STAT:   'MEMB_STAT',     // Estado online
    TBL_CHARACTER:      'Character',     // DB principal de PJs
    TBL_MASTERLEVEL:    'MasterSkillTree', // Donde se guardan datos de Master (S6 TitanTech/MuEmu)
    TBL_GUILD:          'Guild',
    TBL_GUILD_MEMBER:   'GuildMember',
    TBL_GENS:           'Gens_Rank',     // TitanTech (IGC_Gens en IGCN)
    TBL_CASTLE_DATA:    'MuCastle_DATA',
    
    // ────────────── COLUMNS (Character) ──────────────
    CLMN_CHR_NAME:      'Name',
    CLMN_CHR_CLASS:     'Class',
    CLMN_CHR_CLEVEL:    'cLevel',
    CLMN_CHR_RESETS:    'ResetCount',     // Louis/MuEmu: ResetCount, WebEngine defaults to Resets
    CLMN_CHR_GRSTS:     'MasterResetCount', // Grand Reset/Master Reset
    CLMN_CHR_PK:        'PkCount',
    CLMN_CHR_PK_LEVEL:  'PkLevel',
    CLMN_CHR_MAP:       'MapNumber',

    // ────────────── COLUMNS (MasterSkillTree) ──────────────
    // Nombres si el master level está separado:
    CLMN_ML_NAME:       'Name',
    CLMN_ML_LEVEL:      'MasterLevel',   // Típicamente 'MasterLevel' o 'mLevel' según DB

    // ────────────── COLUMNS (Gens) ──────────────
    CLMN_GENS_NAME:     'Name',
    CLMN_GENS_FAMILY:   'Family',        // 1=Duprian, 2=Varnert
    CLMN_GENS_CONTRIB:  'Contribution',
    
    // ────────────── COLUMNS (Guild) ──────────────
    CLMN_GUILD_NAME:    'G_Name',
    CLMN_GUILD_MASTER:  'G_Master',
    CLMN_GUILD_SCORE:   'G_Score',
    CLMN_GUILD_MARK:    'G_Mark',
    
    // ────────────── CMS TABLES (Me_MuOnline) ──────────────
    // Si usas bases separadas, incluimos el prefijo de catálogo:
    CMS_DB:             'Me_MuOnline.dbo', // Agrega esto antes de cualquier tabla de WebEngine
    TBL_CMS_NEWS:       'WEBENGINE_NEWS',
    TBL_CMS_VOTES:      'WEBENGINE_VOTE_LOGS',
    CLMN_CMS_VOTE_USER: 'user_id', // Diferentes versiones de WebEngine usan vote_user o account_id o user_id. Típicamente 'user_id'.
    TBL_CMS_DOWNLOADS:  'WEBENGINE_DOWNLOADS'
};

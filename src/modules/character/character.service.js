/**
 * src/modules/character/character.service.js
 *
 * Servicio de Personaje — 1:1 con class.character.php de WebEngine
 *
 * Cubre: AccountCharacter, CharacterData, CharacterBelongsToAccount,
 *        CharacterExists, CharacterReset, CharacterAddStats, DeductZEN
 *
 * Config de Reset (equivalente a mconfig('*') de WebEngine):
 *   Todos los parámetros se leen desde process.env para flexibilidad.
 */

'use strict';

const prisma  = require('../../config/database');
const appCfg  = require('../../config/app');

// ── Configuración de Reset (equivalente a mconfig en WebEngine) ───
const RESET_CFG = {
    requiredLevel:         parseInt(process.env.RESET_REQUIRED_LEVEL      || '400'),
    maximumResets:         parseInt(process.env.RESET_MAX_RESETS          || '0'),   // 0 = sin límite
    zenCost:               parseInt(process.env.RESET_ZEN_COST            || '0'),
    keepStats:             process.env.RESET_KEEP_STATS   === 'true',
    pointsReward:          parseInt(process.env.RESET_POINTS_REWARD       || '0'),
    multiplyByResets:      process.env.RESET_MULTIPLY_POINTS === 'true',
    clearInventory:        process.env.RESET_CLEAR_INVENTORY === 'true',
    revertClassEvolution:  process.env.RESET_REVERT_CLASS === 'true',
};

// ── Config de AddStats ────────────────────────────────────────────
const ADDSTATS_CFG = {
    requiredLevel: parseInt(process.env.ADDSTATS_REQUIRED_LEVEL || '0'),
    zenCost:       parseInt(process.env.ADDSTATS_ZEN_COST       || '0'),
    maxStats:      parseInt(process.env.ADDSTATS_MAX_STATS      || '32767'),
    minimumLimit:  parseInt(process.env.ADDSTATS_MINIMUM_LIMIT  || '0'),
};

// ── Stats base por clase S6E3 (equivalente a _getClassBaseStats) ──
// Fuente: app.js appCfg.classes — base_stats por clase
function getClassBaseStats(classCode) {
    const cls = appCfg.classes[classCode];
    if (!cls) throw new Error('Unknown character class.');
    return cls.base_stats || { str: 0, agi: 0, vit: 0, ene: 0, cmd: 0 };
}

// ── Classes que usan Command stat (DL/DK S6E3) ───────────────────
// Equivalente a custom('character_cmd')
const CMD_CLASSES = [16, 17, 18]; // Dark Lord

const CharacterService = {

    /**
     * accountCharacters — replica AccountCharacter() de WebEngine
     * Devuelve lista de nombres de personajes del username dado.
     */
    async accountCharacters(username) {
        const results = await prisma.$queryRaw`
            SELECT Name FROM Character
            WHERE AccountID = ${username}
        `;
        return Array.isArray(results) ? results.map(r => r.Name) : [];
    },

    /**
     * characterData — replica CharacterData() de WebEngine
     * SELECT * FROM Character WHERE Name = ?
     */
    async characterData(characterName) {
        const results = await prisma.$queryRaw`
            SELECT * FROM Character WHERE Name = ${characterName}
        `;
        return results && results.length > 0 ? results[0] : null;
    },

    /**
     * characterBelongsToAccount — replica CharacterBelongsToAccount()
     */
    async characterBelongsToAccount(characterName, username) {
        const data = await this.characterData(characterName);
        if (!data) return false;
        return data.AccountID.toLowerCase() === username.toLowerCase();
    },

    /**
     * characterExists — replica CharacterExists()
     */
    async characterExists(characterName) {
        const data = await this.characterData(characterName);
        return !!data;
    },

    /**
     * accountOnline — replica accountOnline() de common.php
     * Verifica si la cuenta tiene una conexión activa en MEMB_STAT
     */
    async accountOnline(username) {
        const result = await prisma.$queryRaw`
            SELECT ConnectStat FROM MEMB_STAT
            WHERE memb___id = ${username} AND ConnectStat = 1
        `;
        return Array.isArray(result) && result.length > 0;
    },

    /**
     * deductZen — replica DeductZEN() de WebEngine
     */
    async deductZen(characterName, amount) {
        if (!amount || amount < 1) return false;
        const char = await this.characterData(characterName);
        if (!char || char.Money < amount) return false;
        await prisma.$executeRaw`
            UPDATE Character SET Money = Money - ${amount} WHERE Name = ${characterName}
        `;
        return true;
    },

    // ── CharacterReset ────────────────────────────────────────────
    /**
     * characterReset — replica CharacterReset() de WebEngine
     *
     * Flujo exacto (1:1):
     * 1. Validar que character existe y pertenece al usuario
     * 2. Verificar cuenta offline
     * 3. Cargar characterData
     * 4. Verificar nivel requerido
     * 5. Verificar máximo de resets
     * 6. Calcular puntos de level-up (reward ± existing si keep_stats)
     * 7. Si revert_class → buscar class_group
     * 8. Verificar zen
     * 9. Verificar créditos (no implementado en esta iteración)
     * 10. Calcular base_stats si !keep_stats
     * 11. Ejecutar UPDATE
     */
    async characterReset(characterName, username) {
        // 1. Validar pertenencia
        if (!await this.characterExists(characterName))
            throw new Error('Character not found.');
        if (!await this.characterBelongsToAccount(characterName, username))
            throw new Error('Character does not belong to this account.');

        // 2. Verificar offline
        if (await this.accountOnline(username))
            throw new Error('Your account must be offline to perform a reset.');

        // 3. Datos del personaje
        const charData = await this.characterData(characterName);

        // 4. Nivel requerido
        if (RESET_CFG.requiredLevel >= 1) {
            if (charData.cLevel < RESET_CFG.requiredLevel)
                throw new Error(`You need to be level ${RESET_CFG.requiredLevel} to reset.`);
        }

        // 5. Máximo de resets
        const nextReset = charData.ResetCount + 1;
        if (RESET_CFG.maximumResets > 0 && nextReset > RESET_CFG.maximumResets)
            throw new Error(`Maximum resets (${RESET_CFG.maximumResets}) reached.`);

        // 6. Puntos de level-up
        let newPoints = RESET_CFG.pointsReward >= 1 ? RESET_CFG.pointsReward : 0;
        if (RESET_CFG.multiplyByResets) newPoints = newPoints * nextReset;
        if (!RESET_CFG.keepStats) {
            // no keep_stats: comenzar desde 0 (no acumular)
        } else {
            // keep_stats: sumar los puntos actuales
            newPoints += charData.LevelUpPoint;
        }

        // 7. Zen
        if (RESET_CFG.zenCost > 0) {
            if (charData.Money < RESET_CFG.zenCost)
                throw new Error(`You need ${RESET_CFG.zenCost.toLocaleString()} Zen to reset.`);
        }

        // 8. Base stats si !keep_stats
        const baseStats = RESET_CFG.keepStats ? null : getClassBaseStats(charData.Class);

        // 9. Clase revertida
        let revertedClass = null;
        if (RESET_CFG.revertClassEvolution) {
            const cls = appCfg.classes[charData.Class];
            if (!cls) throw new Error('Unknown class data for revert.');
            revertedClass = cls.class_group !== undefined ? cls.class_group : charData.Class;
        }

        // 10. Ejecutar UPDATE (equivale al query dinámico de WebEngine)
        const newZen = RESET_CFG.zenCost > 0 ? charData.Money - RESET_CFG.zenCost : charData.Money;

        if (RESET_CFG.keepStats) {
            await prisma.$executeRaw`
                UPDATE Character SET
                    cLevel     = 1,
                    LevelUpPoint = ${newPoints},
                    Money      = ${newZen},
                    ResetCount = ResetCount + 1
                WHERE Name = ${characterName}
            `;
        } else {
            await prisma.$executeRaw`
                UPDATE Character SET
                    cLevel     = 1,
                    LevelUpPoint = ${newPoints},
                    Money      = ${newZen},
                    ResetCount = ResetCount + 1,
                    Strength   = ${baseStats.str},
                    Dexterity  = ${baseStats.agi},
                    Vitality   = ${baseStats.vit},
                    Energy     = ${baseStats.ene},
                    Leadership = ${baseStats.cmd}
                WHERE Name = ${characterName}
            `;
        }
    },

    // ── CharacterAddStats ─────────────────────────────────────────
    /**
     * characterAddStats — replica CharacterAddStats() de WebEngine
     *
     * Flujo exacto (1:1):
     * 1. Validar character/pertenencia
     * 2. Calcular total de puntos a gastar
     * 3. Verificar mínimo (minimum_limit)
     * 4. Verificar cuenta offline
     * 5. Cargar characterData y verificar LevelUpPoint suficiente
     * 6. Calcular nuevos stats y verificar límite (max_stats)
     * 7. Verificar nivel requerido
     * 8. Verificar zen
     * 9. Ejecutar UPDATE
     */
    async characterAddStats(characterName, username, { str = 0, agi = 0, vit = 0, ene = 0, cmd = 0 }) {
        // 1. Validar
        if (!await this.characterExists(characterName))
            throw new Error('Character not found.');
        if (!await this.characterBelongsToAccount(characterName, username))
            throw new Error('Character does not belong to this account.');

        // 2. Total de puntos
        const total = str + agi + vit + ene + cmd;

        // 3. Mínimo
        if (total < ADDSTATS_CFG.minimumLimit)
            throw new Error(`Minimum points to add: ${ADDSTATS_CFG.minimumLimit}.`);

        // 4. Offline
        if (await this.accountOnline(username))
            throw new Error('Your account must be offline to add stats.');

        // 5. Character data y puntos disponibles
        const charData = await this.characterData(characterName);
        if (charData.LevelUpPoint < total)
            throw new Error(`Insufficient level-up points. You have ${charData.LevelUpPoint}, need ${total}.`);

        // 6. Nuevos stats y límite
        const newStr = charData.Strength   + str;
        const newAgi = charData.Dexterity  + agi;
        const newVit = charData.Vitality   + vit;
        const newEne = charData.Energy     + ene;
        const MAX    = ADDSTATS_CFG.maxStats;

        if (newStr > MAX || newAgi > MAX || newVit > MAX || newEne > MAX)
            throw new Error(`Maximum stat value is ${MAX.toLocaleString()}.`);

        // Command — solo para clases que lo soportan (Dark Lord)
        let newCmd = charData.Leadership;
        if (cmd > 0) {
            if (!CMD_CLASSES.includes(charData.Class))
                throw new Error('This character class does not support the Command stat.');
            newCmd = charData.Leadership + cmd;
            if (newCmd > MAX)
                throw new Error(`Maximum stat value is ${MAX.toLocaleString()}.`);
        }

        // 7. Nivel requerido
        if (ADDSTATS_CFG.requiredLevel > 0 && charData.cLevel < ADDSTATS_CFG.requiredLevel)
            throw new Error(`Required level: ${ADDSTATS_CFG.requiredLevel}.`);

        // 8. Zen
        if (ADDSTATS_CFG.zenCost > 0 && charData.Money < ADDSTATS_CFG.zenCost)
            throw new Error(`You need ${ADDSTATS_CFG.zenCost.toLocaleString()} Zen to add stats.`);

        const newZen = ADDSTATS_CFG.zenCost > 0 ? charData.Money - ADDSTATS_CFG.zenCost : charData.Money;

        // 9. UPDATE
        await prisma.$executeRaw`
            UPDATE Character SET
                LevelUpPoint = LevelUpPoint - ${total},
                Strength     = ${newStr},
                Dexterity    = ${newAgi},
                Vitality     = ${newVit},
                Energy       = ${newEne},
                Leadership   = ${newCmd},
                Money        = ${newZen}
            WHERE Name = ${characterName}
        `;
    },
};

module.exports = { CharacterService, RESET_CFG, ADDSTATS_CFG };

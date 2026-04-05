/**
 * src/modules/usercp/usercp.controller.js
 *
 * Controller de Panel de Usuario — 1:1 con los módulos de WebEngine:
 *   myaccount.php, reset.php, addstats.php, mypassword.php
 */

'use strict';

const { validationResult }              = require('express-validator');
const { CharacterService, RESET_CFG, ADDSTATS_CFG } = require('../character/character.service');
const { AccountService }                = require('../account/account.service');
const prisma                            = require('../../config/database');

// ── Middleware: requiere login ────────────────────────────────────
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// ── Helper CSRF ───────────────────────────────────────────────────
function csrf(req, res) {
    return req.app.get('generateCsrfToken')(req, res);
}

// ─────────────────────────────────────────────────────────────────
// MY ACCOUNT — replica myaccount.php
// ─────────────────────────────────────────────────────────────────
async function showMyAccount(req, res) {
    const { id: username } = req.session.user;

    // accountInformation (replica common->accountInformation)
    const account = await AccountService.getAccount(username);

    // accountOnline (replica common->accountOnline)
    const online = await CharacterService.accountOnline(username);

    // characters (replica Character->AccountCharacter)
    const charNames   = await CharacterService.accountCharacters(username);
    const characters  = [];
    for (const name of charNames) {
        const data = await CharacterService.characterData(name);
        if (data) characters.push(data);
    }

    // Connection history — últimas 10
    let connectionHistory = [];
    try {
        connectionHistory = await prisma.$queryRaw`
            SELECT TOP 10 * FROM MEMB_CONN WHERE memb___id = ${username}
            ORDER BY ConnDate DESC
        `;
    } catch { /* tabla puede no existir */ }

    res.render('pages/usercp/myaccount', {
        title:    'My Account | NodeEngine',
        account,
        online,
        characters,
        connectionHistory,
        csrfToken: csrf(req, res),
    });
}

// ─────────────────────────────────────────────────────────────────
// CHARACTER RESET — replica reset.php
// ─────────────────────────────────────────────────────────────────
async function showReset(req, res) {
    const { id: username } = req.session.user;
    const charNames = await CharacterService.accountCharacters(username);
    const characters = [];
    for (const name of charNames) {
        const data = await CharacterService.characterData(name);
        if (data) characters.push(data);
    }
    res.render('pages/usercp/reset', {
        title:      'Character Reset | NodeEngine',
        characters,
        resetCfg:   RESET_CFG,
        error:      null,
        success:    null,
        csrfToken:  csrf(req, res),
    });
}

async function doReset(req, res) {
    const { id: username } = req.session.user;
    const charNames = await CharacterService.accountCharacters(username);
    const characters = [];
    for (const name of charNames) {
        const data = await CharacterService.characterData(name);
        if (data) characters.push(data);
    }

    const charToReset = req.body.character;
    let error   = null;
    let success = null;

    try {
        await CharacterService.characterReset(charToReset, username);
        success = `Character ${charToReset} has been successfully reset.`;
        // Refrescar datos
        const updated = [];
        for (const name of charNames) {
            const data = await CharacterService.characterData(name);
            if (data) updated.push(data);
        }
        characters.splice(0, characters.length, ...updated);
    } catch (err) {
        error = err.message;
    }

    res.render('pages/usercp/reset', {
        title:     'Character Reset | NodeEngine',
        characters,
        resetCfg:  RESET_CFG,
        error,
        success,
        csrfToken: csrf(req, res),
    });
}

// ─────────────────────────────────────────────────────────────────
// ADD STATS — replica addstats.php
// ─────────────────────────────────────────────────────────────────
async function showAddStats(req, res) {
    const { id: username } = req.session.user;
    const charNames = await CharacterService.accountCharacters(username);
    const characters = [];
    for (const name of charNames) {
        const data = await CharacterService.characterData(name);
        if (data) characters.push(data);
    }
    res.render('pages/usercp/addstats', {
        title:       'Add Stats | NodeEngine',
        characters,
        addstatsCfg: ADDSTATS_CFG,
        error:       null,
        success:     null,
        csrfToken:   csrf(req, res),
    });
}

async function doAddStats(req, res) {
    const { id: username } = req.session.user;
    const charNames = await CharacterService.accountCharacters(username);
    const characters = [];
    for (const name of charNames) {
        const data = await CharacterService.characterData(name);
        if (data) characters.push(data);
    }

    const charName = req.body.character;
    const stats = {
        str: parseInt(req.body.add_str) || 0,
        agi: parseInt(req.body.add_agi) || 0,
        vit: parseInt(req.body.add_vit) || 0,
        ene: parseInt(req.body.add_ene) || 0,
        cmd: parseInt(req.body.add_cmd) || 0,
    };

    let error   = null;
    let success = null;

    try {
        await CharacterService.characterAddStats(charName, username, stats);
        success = `Stats added successfully to ${charName}.`;
        const updated = [];
        for (const name of charNames) {
            const data = await CharacterService.characterData(name);
            if (data) updated.push(data);
        }
        characters.splice(0, characters.length, ...updated);
    } catch (err) {
        error = err.message;
    }

    res.render('pages/usercp/addstats', {
        title:       'Add Stats | NodeEngine',
        characters,
        addstatsCfg: ADDSTATS_CFG,
        error,
        success,
        csrfToken:   csrf(req, res),
    });
}

// ─────────────────────────────────────────────────────────────────
// CHANGE PASSWORD — replica mypassword.php
// ─────────────────────────────────────────────────────────────────
async function showChangePass(req, res) {
    res.render('pages/usercp/changepass', {
        title:     'Change Password | NodeEngine',
        error:     null,
        success:   null,
        csrfToken: csrf(req, res),
    });
}

async function doChangePass(req, res) {
    const { id: username } = req.session.user;
    let error   = null;
    let success = null;

    try {
        const { currentPass, newPass, confirmPass } = req.body;

        if (!currentPass || !newPass || !confirmPass)
            throw new Error('All fields are required.');

        if (newPass !== confirmPass)
            throw new Error('New passwords do not match.');

        // Verificar contraseña actual (replica validateUser + PasswordLength)
        const valid = await AccountService.validateUser(username, currentPass);
        if (!valid) throw new Error('Current password is incorrect.');

        // Cambiar contraseña (replica changePassword de common.php)
        const { hashPassword } = require('../account/account.service');
        const newHash = hashPassword(newPass, username);

        await prisma.MEMB_INFO.updateMany({
            where: { memb___id: username },
            data:  { memb__pwd: newHash },
        });

        success = 'Password changed successfully.';
    } catch (err) {
        error = err.message;
    }

    res.render('pages/usercp/changepass', {
        title:     'Change Password | NodeEngine',
        error,
        success,
        csrfToken: csrf(req, res),
    });
}

// ─────────────────────────────────────────────────────────────────
// CHANGE EMAIL — replica myemail.php
// ─────────────────────────────────────────────────────────────────
async function showChangeEmail(req, res) {
    res.render('pages/usercp/changeemail', {
        title:     'Change Email | NodeEngine',
        error:     null,
        success:   null,
        csrfToken: csrf(req, res),
    });
}

async function doChangeEmail(req, res) {
    const { id: username } = req.session.user;
    let error   = null;
    let success = null;

    try {
        const { newEmail } = req.body;
        if (!newEmail || !newEmail.includes('@'))
            throw new Error('Please enter a valid email address.');

        // replica changeEmailAddress — actualiza mail_addr en MEMB_INFO
        const existing = await prisma.$queryRaw`
            SELECT memb___id FROM MEMB_INFO
            WHERE mail_addr = ${newEmail} AND memb___id != ${username}
        `;
        if (existing && existing.length > 0)
            throw new Error('This email address is already in use.');

        await prisma.MEMB_INFO.updateMany({
            where: { memb___id: username },
            data:  { mail_addr: newEmail },
        });

        // Actualizar sesión
        if (req.session.user) req.session.user.email = newEmail;
        success = 'Email address updated successfully.';
    } catch (err) {
        error = err.message;
    }

    res.render('pages/usercp/changeemail', {
        title:     'Change Email | NodeEngine',
        error,
        success,
        csrfToken: csrf(req, res),
    });
}

module.exports = {
    requireLogin,
    showMyAccount,
    showReset, doReset,
    showAddStats, doAddStats,
    showChangePass, doChangePass,
    showChangeEmail, doChangeEmail,
};

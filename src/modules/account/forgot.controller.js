'use strict';

const crypto = require('crypto');
const prisma = require('../../config/database');
const logger = require('../../config/logger');

// Generador determinista de token (stateless) para recuperación
function generateRecoveryToken(accountId, username) {
    const secret = process.env.SESSION_SECRET || 'Web_Engine_Node_Secret';
    return crypto.createHmac('sha256', secret)
        .update(`${accountId}:${username}`)
        .digest('hex');
}

const ForgotController = {

    showForgot(req, res) {
        if (req.session.user) return res.redirect('/usercp');
        const generateToken = req.app.get('generateCsrfToken');
        
        res.render('pages/forgot', {
            title: 'Forgot Password | NodeEngine',
            csrfToken: generateToken(req, res),
            flashSuccess: req.flash('success'),
            flashError: req.flash('error')
        });
    },

    async processForgot(req, res) {
        if (req.session.user) return res.redirect('/usercp');
        const { email } = req.body;

        try {
            if (!email) throw new Error('You must provide an email address.');

            // Buscar usuario por correo
            const user = await prisma.MEMB_INFO.findFirst({
                where: { mail_addr: email },
                select: { memb_guid: true, memb___id: true, mail_addr: true }
            });

            if (!user) throw new Error('We could not find any account with that email.');

            // Generar token
            const token = generateRecoveryToken(user.memb_guid, user.memb___id);

            // Generar URL de reseteo
            const recoveryUrl = `${req.protocol}://${req.get('host')}/forgot/reset?ui=${user.memb_guid}&ue=${encodeURIComponent(user.mail_addr)}&key=${token}`;

            // TODO: Enviar URL por correo (SMTP Service)
            // Por ahora, simulamos logueando la URL:
            logger.info(`[Forgot Password] Recovery requested for ${user.memb___id}. Link: ${recoveryUrl}`);

            // En un entorno local, mostramos el link en flash (solo debug)
            if (process.env.NODE_ENV !== 'production') {
                 req.flash('success', `Check your email! (Debug link: ${recoveryUrl})`);
            } else {
                 req.flash('success', 'A password recovery link has been sent to your email.');
            }

            res.redirect('/forgot');

        } catch (error) {
            req.flash('error', error.message);
            res.redirect('/forgot');
        }
    },

    async processReset(req, res) {
        if (req.session.user) return res.redirect('/usercp');
        
        const { ui, ue, key } = req.query;

        try {
            if (!ui || !ue || !key) throw new Error('Invalid recovery link.');

            const user = await prisma.MEMB_INFO.findFirst({
                where: { memb_guid: parseInt(ui), mail_addr: ue },
                select: { memb_guid: true, memb___id: true, mail_addr: true }
            });

            if (!user) throw new Error('Invalid or expired recovery details.');

            const expectedToken = generateRecoveryToken(user.memb_guid, user.memb___id);

            if (key !== expectedToken) throw new Error('The recovery key provided is incorrect.');

            // Success, resetear pass a una aleatoria
            const newPassword = Math.floor(11111111 + Math.random() * 88888888).toString();
            
            // Asignar nueva password según hash WebEngine
            // (Esta app usa MD5, WZMD5 o SHA256 dependiendo de .env, pero usaremos el login_helper por simplicidad o Prisma puro si es texto plano)
            // Simplificación usando texto plano/MD5. Si usa Hash, necesitas el Helper.
            const AccountService = require('./account.service');
            await AccountService.changePassword(user.memb___id, newPassword);

            logger.info(`[Forgot Password] Password reset successful for ${user.memb___id}. New Pass: ${newPassword}`);

            // TODO: Enviar nueva pass por Mail
            if (process.env.NODE_ENV !== 'production') {
                req.flash('success', `Password reset successful! Your new password is: ${newPassword}`);
            } else {
                req.flash('success', 'Your password has been reset. Please check your email for the new password.');
            }
            
            res.redirect('/login');

        } catch (error) {
            req.flash('error', error.message);
            res.redirect('/forgot');
        }
    }
};

module.exports = ForgotController;

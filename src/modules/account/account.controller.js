/**
 * src/modules/account/account.controller.js
 *
 * Controller de cuentas — 1:1 con class.login.php y modules/login.php de WebEngine
 *
 * Flujo de login de WebEngine:
 *  1. check_value (campos vacíos) → hecho en validator
 *  2. canLogin (chequeo de IP bloqueada por FLA)
 *  3. userExists
 *  4. validateUser (hash comparison)
 *  5. Si OK: removeFailedLogins, session_regenerate_id, set session
 *  6. Si KO: addFailedLogin, mensaje de error
 *
 * Flujo de registro:
 *  1. Si ya logueado → redirect (replica "if(isLoggedIn()) redirect()")
 *  2. Validaciones via express-validator (replica Validator::*)
 *  3. registerAccount()
 *  4. Auto-login o redirect a login
 */

'use strict';

const { validationResult } = require('express-validator');
const { AccountService }   = require('./account.service');
const appCfg               = require('../../config/app');

// Rate limits de login (equivalente a mconfig en WebEngine)
const MAX_LOGIN_ATTEMPTS   = 5;   // mconfig('max_login_attempts')
const FAILED_LOGIN_TIMEOUT = 15;  // minutos — mconfig('failed_login_timeout')

const AccountController = {

    // ── Registro ──────────────────────────────────────────────────────────────

    showRegister(req, res) {
        // replica: if(isLoggedIn()) redirect();
        if (req.session.user) return res.redirect('/');

        const generateToken = req.app.get('generateCsrfToken');
        res.render('pages/register', {
            title:     'Register | NodeEngine',
            errors:    null,
            old:       {},
            csrfToken: generateToken(req, res),
        });
    },

    async register(req, res) {
        if (req.session.user) return res.redirect('/');

        const generateToken = req.app.get('generateCsrfToken');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('pages/register', {
                title:     'Register | NodeEngine',
                errors:    errors.array(),
                old:       req.body,
                csrfToken: generateToken(req, res),
            });
        }

        try {
            await AccountService.registerAccount({
                username: req.body.username.trim(),
                password: req.body.password,
                email:    req.body.email.trim().toLowerCase(),
            });

            // Auto-login tras registro (replica: if($regCfg['automatic_login']))
            const account = await AccountService.getAccount(req.body.username.trim());
            req.session.regenerate((err) => {
                if (err) throw err;
                req.session.user = {
                    id:       account.memb___id,
                    name:     account.memb_name,
                    email:    account.mail_addr,
                    isAdmin:  account.ctl1_code.trim() !== '0',
                };
                res.redirect('/');
            });

        } catch (error) {
            res.render('pages/register', {
                title:     'Register | NodeEngine',
                errors:    [{ msg: error.message }],
                old:       req.body,
                csrfToken: generateToken(req, res),
            });
        }
    },

    // ── Login ──────────────────────────────────────────────────────────────────

    showLogin(req, res) {
        if (req.session.user) return res.redirect('/');

        const generateToken = req.app.get('generateCsrfToken');
        res.render('pages/login', {
            title:     'Login | NodeEngine',
            error:     null,
            csrfToken: generateToken(req, res),
        });
    },

    async login(req, res) {
        if (req.session.user) return res.redirect('/');

        const generateToken = req.app.get('generateCsrfToken');
        const ip = req.ip;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('pages/login', {
                title:     'Login | NodeEngine',
                error:     errors.array()[0].msg,
                csrfToken: generateToken(req, res),
            });
        }

        const username = req.body.username.trim();
        const password = req.body.password;

        try {
            // 2. canLogin — chequeo de IP bloqueada (replica canLogin() de WebEngine)
            const canLogin = await AccountService.canLogin(ip, MAX_LOGIN_ATTEMPTS);
            if (!canLogin) {
                return res.render('pages/login', {
                    title:     'Login | NodeEngine',
                    error:     'Your IP has been temporarily locked due to multiple failed login attempts. Please try again later.',
                    csrfToken: generateToken(req, res),
                });
            }

            // 3. userExists
            const exists = await AccountService.userExists(username);
            if (!exists) {
                return res.render('pages/login', {
                    title:     'Login | NodeEngine',
                    error:     'Invalid username or password.',
                    csrfToken: generateToken(req, res),
                });
            }

            // 4. validateUser (hash comparison)
            const valid = await AccountService.validateUser(username, password);

            if (!valid) {
                // addFailedLogin en fallo
                await AccountService.addFailedLogin(username, ip, MAX_LOGIN_ATTEMPTS, FAILED_LOGIN_TIMEOUT);
                const failCount = await AccountService.checkFailedLogins(ip);

                return res.render('pages/login', {
                    title:     'Login | NodeEngine',
                    error:     `Invalid username or password. Attempt ${failCount} of ${MAX_LOGIN_ATTEMPTS}.`,
                    csrfToken: generateToken(req, res),
                });
            }

            // Cuenta baneada — bloc_code !== '0'
            const banned = await AccountService.isAccountBanned(username);
            if (banned) {
                return res.render('pages/login', {
                    title:     'Login | NodeEngine',
                    error:     'This account has been suspended.',
                    csrfToken: generateToken(req, res),
                });
            }

            // 5. Login exitoso
            await AccountService.removeFailedLogins(ip); // Limpia FLA

            const account = await AccountService.getAccount(username);

            // session_regenerate_id() — previene session fixation
            req.session.regenerate((err) => {
                if (err) {
                    throw err;
                }
                req.session.user = {
                    id:      account.memb___id,
                    name:    account.memb_name,
                    email:   account.mail_addr,
                    isAdmin: account.ctl1_code.trim() !== '0',
                };
                res.redirect('/usercp');
            });

        } catch (error) {
            res.render('pages/login', {
                title:     'Login | NodeEngine',
                error:     'An error occurred. Please try again.',
                csrfToken: generateToken(req, res),
            });
        }
    },

    // ── Logout ─────────────────────────────────────────────────────────────────

    logout(req, res) {
        // replica: $_SESSION = array(); session_destroy(); redirect();
        req.session.destroy(() => {
            res.redirect('/');
        });
    },
};

module.exports = AccountController;

/**
 * src/modules/account/validator.js
 *
 * Validaciones de formulario — 1:1 con class.validator.php de WebEngine
 *
 * UsernameLength: config('username_min_len') y config('username_max_len')
 * PasswordLength: config('password_min_len') y config('password_max_len')
 * AlphaNumeric:   /^[0-9a-zA-Z]+$/  — solo letras y números, sin símbolos
 * Email:          regex de WebEngine (más estricto que isEmail() de express-validator)
 */

'use strict';

const { body } = require('express-validator');
const appCfg   = require('../../config/app');

// Límites de WebEngine — leídos desde app.js (equivalente a config() en PHP)
const USERNAME_MIN = appCfg.character.usernameMinLen;
const USERNAME_MAX = appCfg.character.usernameMaxLen;
const PASSWORD_MIN = appCfg.character.passwordMinLen;
const PASSWORD_MAX = appCfg.character.passwordMaxLen;

// Regex AlphaNumeric — exacto de class.validator.php: /^[0-9a-zA-Z]+$/
const ALPHANUMERIC_RE = /^[0-9a-zA-Z]+$/;

// Regex Email — exacto de class.validator.php
const EMAIL_RE = /^([a-z0-9])([-a-z0-9._]*([a-z0-9]))*@([a-z0-9])(([a-z0-9-])*([a-z0-9]))+(\.[a-z0-9]([-a-z0-9_-])?([a-z0-9])+)+$/i;

exports.registerValidator = [
    body('username')
        .notEmpty().withMessage('The username field is required.')
        .isLength({ min: USERNAME_MIN, max: USERNAME_MAX })
            .withMessage(`Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters.`)
        .matches(ALPHANUMERIC_RE)
            .withMessage('Username must contain only letters and numbers.'),

    body('password')
        .notEmpty().withMessage('The password field is required.')
        .isLength({ min: PASSWORD_MIN, max: PASSWORD_MAX })
            .withMessage(`Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`),

    body('cpassword')
        .notEmpty().withMessage('Please confirm your password.')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match.');
            }
            return true;
        }),

    body('email')
        .notEmpty().withMessage('The email address field is required.')
        .matches(EMAIL_RE).withMessage('Please enter a valid email address.'),
];

exports.loginValidator = [
    body('username').notEmpty().withMessage('The username field is required.'),
    body('password').notEmpty().withMessage('The password field is required.'),
];

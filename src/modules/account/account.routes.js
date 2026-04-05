const express = require('express');
const router = express.Router();
const AccountController = require('./account.controller');
const ForgotController = require('./forgot.controller');
const { registerValidator, loginValidator } = require('./validator');

/**
 * Public Account Routes
 */

// GET
router.get('/login', AccountController.showLogin);
router.get('/register', AccountController.showRegister);
router.get('/logout', AccountController.logout);
router.get('/forgot', ForgotController.showForgot);
router.get('/forgot/reset', ForgotController.processReset);

// POST
router.post('/login', loginValidator, AccountController.login);
router.post('/register', registerValidator, AccountController.register);
router.post('/forgot', ForgotController.processForgot);

module.exports = router;

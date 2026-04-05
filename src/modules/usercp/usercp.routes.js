'use strict';
const express    = require('express');
const router     = express.Router();
const uc         = require('./usercp.controller');

// Todas las rutas de UserCP requieren login
router.use(uc.requireLogin);

// Dashboard principal
router.get('/',            uc.showMyAccount);

// Reset
router.get('/reset',       uc.showReset);
router.post('/reset',      uc.doReset);

// Add Stats
router.get('/addstats',    uc.showAddStats);
router.post('/addstats',   uc.doAddStats);

// Change Password
router.get('/changepass',  uc.showChangePass);
router.post('/changepass', uc.doChangePass);

// Change Email
router.get('/changeemail',  uc.showChangeEmail);
router.post('/changeemail', uc.doChangeEmail);

module.exports = router;

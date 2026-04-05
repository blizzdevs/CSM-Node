'use strict';

const express = require('express');
const router = express.Router();
const PagesController = require('./pages.controller');

router.get('/tos', PagesController.showTerms);
router.get('/privacy', PagesController.showPrivacy);
router.get('/refunds', PagesController.showRefunds);
router.get('/info', PagesController.showInfo);
router.get('/contact', PagesController.showContact);
router.post('/contact', PagesController.processContact);

module.exports = router;

'use strict';
const express = require('express');
const router  = express.Router();
const rc      = require('./rankings.controller');

router.get('/',      (req, res) => res.redirect('/rankings/level'));
router.get('/:type', rc.showRankings);

module.exports = router;

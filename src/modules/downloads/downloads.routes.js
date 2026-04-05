'use strict';
const express = require('express');
const router  = express.Router();
const dc      = require('./downloads.controller');

router.get('/', dc.show);
module.exports = router;

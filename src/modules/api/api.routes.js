'use strict';

const express = require('express');
const router = express.Router();
const ApiEventsController = require('./api.events');

// /api/events
router.get('/events', ApiEventsController.getEvents);

module.exports = router;

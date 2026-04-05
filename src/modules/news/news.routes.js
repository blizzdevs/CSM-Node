'use strict';
const express        = require('express');
const router         = express.Router();
const NewsController = require('./news.controller');

router.get('/',    NewsController.showNewsList);
router.get('/:id', NewsController.showNewsDetail);

module.exports = router;

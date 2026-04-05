/**
 * src/modules/news/news.controller.js
 * 1:1 con modules/news.php de WebEngine
 */
'use strict';

const NewsService = require('./news.service');

const NewsController = {

    showNewsList(req, res) {
        const news = NewsService.getNewsList(15);
        res.render('pages/news', {
            title: 'News | NodeEngine',
            news,
        });
    },

    showNewsDetail(req, res) {
        const id = req.params.id;
        const article = NewsService.getNewsById(id);

        if (!article) {
            return res.status(404).render('pages/error', {
                title:   'Not Found | NodeEngine',
                message: 'The news article you requested does not exist.',
            });
        }

        res.render('pages/news-detail', {
            title:   `${article.news_title} | NodeEngine`,
            article,
        });
    },
};

module.exports = NewsController;

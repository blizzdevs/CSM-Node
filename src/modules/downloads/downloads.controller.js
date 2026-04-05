'use strict';
const DownloadsService = require('./downloads.service');

const DownloadsController = {
    show(req, res) {
        const { clients, patches, tools } = DownloadsService.getDownloads();
        res.render('pages/downloads', {
            title:   'Downloads | NodeEngine',
            clients,
            patches,
            tools,
        });
    },
};

module.exports = DownloadsController;

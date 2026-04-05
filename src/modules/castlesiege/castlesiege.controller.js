'use strict';

const CastleSiegeService = require('./castlesiege.service');

const CastleSiegeController = {
    showSiege(req, res) {
        const siegeData = CastleSiegeService.getSiegeData() || {};

        res.render('pages/castlesiege', {
            title: 'Castle Siege | NodeEngine',
            castleInfo: siegeData.castleInfo,
            ownerGuild: siegeData.ownerGuild,
            lastUpdate: siegeData.last_update
        });
    }
};

module.exports = CastleSiegeController;

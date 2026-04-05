'use strict';

const RankingsService = require('./rankings.service');

const DEFAULT_TAB = 'level';

// Nombres de columnas de cada tipo para la vista
const COLUMN_DEFS = {
    level:       [['#','r-pos'],['Character',''],['Class','r-class'],['Level','r-val']],
    resets:      [['#','r-pos'],['Character',''],['Class','r-class'],['Resets','r-val'],['Level','r-val']],
    killers:     [['#','r-pos'],['Character',''],['Class','r-class'],['Kills','r-val'],['Level','r-val']],
    guilds:      [['#','r-pos'],['Guild',''],['Master','r-class'],['Score','r-val']],
    grandresets: [['#','r-pos'],['Character',''],['Class','r-class'],['GR','r-val'],['Resets','r-val']],
    master:      [['#','r-pos'],['Character',''],['Class','r-class'],['M.Level','r-val'],['Level','r-val']],
    online:      [['#','r-pos'],['Character',''],['Class','r-class'],['Hours','r-val'],['Map','r-val']],
    gens:        [['#','r-pos'],['Character',''],['Family','r-class'],['Contribution','r-val']],
    votes:       [['#','r-pos'],['Account',''],['Votes','r-val']],
};

// Mapeo nombre de columna → campo del objeto de BD para cada type
const ROW_FIELDS = {
    level:       r => [r.Name, r.Class, r.cLevel],
    resets:      r => [r.Name, r.Class, r.ResetCount, r.cLevel],
    killers:     r => [r.Name, r.Class, r.PkCount, r.cLevel],
    guilds:      r => [r.G_Name, r.G_Master, r.G_Score],
    grandresets: r => [r.Name, r.Class, r.GrandResetCount, r.ResetCount],
    master:      r => [r.Name, r.Class, r.MasterLevel, r.cLevel],
    online:      r => [r.Name, r.Class, Math.floor(r.OnlineHours), r.Map],
    gens:        r => [r.Name, r.Family, r.Contribution],
    votes:       r => [r.Name, r.TotalVotes],
};

const RankingsController = {

    showRankings(req, res) {
        const type    = req.params.type || DEFAULT_TAB;
        const menu    = RankingsService.getMenu();
        const cached  = RankingsService.getCached(type);
        const rows    = cached ? cached.rankings : [];
        const updated = cached ? cached.last_update : null;

        // Si el type no existe, redirigir al default
        if (!COLUMN_DEFS[type]) return res.redirect('/rankings/' + DEFAULT_TAB);

        res.render('pages/rankings', {
            title:     `Rankings — ${type.charAt(0).toUpperCase() + type.slice(1)} | NodeEngine`,
            menu,
            type,
            columns:   COLUMN_DEFS[type] || [],
            rowFields: ROW_FIELDS[type] || (() => []),
            rows,
            updated,
        });
    },
};

module.exports = RankingsController;

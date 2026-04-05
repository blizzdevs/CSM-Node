const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const util = require('util');

async function snapshot(db, table, where = '') {
    try {
        const query = `SELECT TOP 1 * FROM ${db ? db + '.' : ''}${table} ${where}`;
        const res = await prisma.$queryRawUnsafe(query);
        console.log(`\n=== Snapshot: ${db ? db+'.' : ''}${table} ===`);
        console.log(util.inspect(res[0] || 'EMPTY', {showHidden: false, depth: null, colors: true}));
    } catch(e) {
        console.log(`\n=== Snapshot: ${db ? db+'.' : ''}${table} ===`);
        console.log('ERROR:', e.message.split('\n').pop() || e.message);
    }
}

async function main() {
    console.log('--- INICIANDO EXTRACCION DE DATOS REALES ---');
    
    // MuOnline
    await snapshot('', 'Character');
    await snapshot('', 'MEMB_INFO');
    await snapshot('', 'MEMB_STAT');
    await snapshot('', 'MasterSkillTree');
    await snapshot('', 'Gens_Rank');
    await snapshot('', 'Guild');
    await snapshot('', 'MuCastle_DATA');
    
    // Me_MuOnline (CMS)
    await snapshot('Me_MuOnline.dbo', 'WEBENGINE_NEWS');
    await snapshot('Me_MuOnline.dbo', 'WEBENGINE_VOTE_LOGS');
    await snapshot('Me_MuOnline.dbo', 'WEBENGINE_DOWNLOADS');

    await prisma.$disconnect();
}

main();

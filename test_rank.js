const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mu = require('./src/config/mu_data');

async function testQuery(name, query) {
    try {
        await prisma.$queryRawUnsafe(query);
        console.log(name + ' -> OK');
    } catch(e) {
        console.log(name + ' -> ERROR: ' + e.message);
    }
}

async function main() {
    console.log('--- TESTING RANKINGS ---');
    await testQuery('Votes', `SELECT TOP 5 account_id AS Name FROM ${mu.CMS_DB}.${mu.TBL_CMS_VOTES}`);
    await testQuery('Level', `SELECT TOP 5 ${mu.CLMN_CHR_NAME} AS Name FROM ${mu.TBL_CHARACTER}`);
    await testQuery('Gens', `SELECT TOP 5 G.${mu.CLMN_GENS_NAME} FROM ${mu.TBL_GENS} G`);
    await testQuery('Online', `SELECT TOP 1 S.OnlineHours FROM ${mu.TBL_ACCOUNT_STAT} S JOIN AccountCharacter A ON S.memb___id = A.Id`);
    await testQuery('Master', `SELECT TOP 1 M.${mu.CLMN_ML_LEVEL} FROM ${mu.TBL_CHARACTER} C LEFT JOIN ${mu.TBL_MASTERLEVEL} M ON C.${mu.CLMN_CHR_NAME} = M.${mu.CLMN_ML_NAME}`);
    await prisma.$disconnect();
}
main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const vlogs = await prisma.$queryRawUnsafe("SELECT COLUMN_NAME FROM Me_MuOnline.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WEBENGINE_VOTE_LOGS'");
        console.log('WEBENGINE_VOTE_LOGS cols: ' + vlogs.map(c => c.COLUMN_NAME).join(', '));
        
        const votes = await prisma.$queryRawUnsafe("SELECT COLUMN_NAME FROM Me_MuOnline.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WEBENGINE_VOTES'");
        console.log('WEBENGINE_VOTES cols: ' + votes.map(c => c.COLUMN_NAME).join(', '));
    } catch(e) {}
    await prisma.$disconnect();
}
main();

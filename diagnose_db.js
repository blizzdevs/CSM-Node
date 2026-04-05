const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log("Checking columns for Table: Character...");
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Character'
        `;
        console.log("ACTUAL COLUMNS IN DATABASE:");
        console.table(columns);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();

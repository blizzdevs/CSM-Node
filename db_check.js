const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- REVISANDO TABLAS DE MUONLINE NATIVAS ---');

        // Buscar tablas relacionadas a Gens
        const gensTables = await prisma.$queryRawUnsafe("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Gens%'");
        console.log('\n--- TABLAS GENS ---');
        console.log(gensTables.map(t => t.TABLE_NAME).join(', '));
        
        // Ver columnas de Gens_Duprian / Gens_Varnert o IGC_Gens si existe
        if (gensTables.length > 0) {
            for (let table of gensTables) {
                const gensCols = await prisma.$queryRawUnsafe(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.TABLE_NAME}'`);
                console.log(`\n--- COLUMNAS DE ${table.TABLE_NAME} ---`);
                console.log(gensCols.map(c => c.COLUMN_NAME).join(', '));
            }
        }

        // Buscar tablas relacionadas a Master Level (MasterSkillTree)
        const mstTables = await prisma.$queryRawUnsafe("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Master%' OR TABLE_NAME LIKE '%Skill%'");
        console.log('\n--- TABLAS MASTER / SKILL ---');
        console.log(mstTables.map(t => t.TABLE_NAME).join(', '));
        
        const mstCols = await prisma.$queryRawUnsafe("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MasterSkillTree'");
        if (mstCols && mstCols.length > 0) {
            console.log('\n--- COLUMNAS DE MasterSkillTree ---');
            console.log(mstCols.map(c => c.COLUMN_NAME).join(', '));
        }

    } catch(e) {
        console.error('Error fetching schema:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();

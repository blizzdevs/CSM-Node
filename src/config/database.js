/**
 * src/config/database.js
 *
 * PrismaClient Singleton — NodeEngine CMS
 *
 * Mantenemos UNA sola instancia de PrismaClient por proceso para
 * evitar el agotamiento del connection pool, especialmente durante
 * hot-reload con nodemon.
 *
 * Referencia WebEngine: equivalente a la conexión $this->memuonline
 * en class.common.php, pero sin las queries crudas — Prisma las abstrae.
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
} else {
    // En desarrollo, reusar instancia entre hot-reloads de nodemon
    if (!global.__prisma) {
        global.__prisma = new PrismaClient({
            log: ['error'], // Quitadas 'warn' y 'query' para evitar spam de validaciones de MuOnline
        });
    }
    prisma = global.__prisma;
}

module.exports = prisma;

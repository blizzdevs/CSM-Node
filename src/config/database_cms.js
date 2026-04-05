const { PrismaClient } = require('../../prisma/generated/cms');

/**
 * Prisma Client for Me_MuOnline (CMS database)
 */
const prismaCMS = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prismaCMS;

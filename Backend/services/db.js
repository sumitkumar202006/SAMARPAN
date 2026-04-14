const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Middleware to log queries in development if needed
// prisma.$use(async (params, next) => { ... });

module.exports = prisma;

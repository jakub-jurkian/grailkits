// Singleton approach - one connection for whole service

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
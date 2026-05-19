// Singleton PrismaClient for order-service. Used by the PaymentRepository to
// drive the `Payment` and `PaymentEvent` tables (schema created by Prisma's
// own migration history).
//
// Coexists with Sequelize: Sequelize owns `carts`, `cart_lines`, `orders`,
// `order_items`; Prisma owns `Payment` and `PaymentEvent`. The two sets are
// disjoint and there is no FK between them.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Graceful shutdown: release the connection pool when the process is asked
// to terminate. Mirrors the SIGINT handler in catalog-service/src/config/mongo.js
// for consistency across services.
process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Connection closed on SIGINT');
  } catch (err) {
    console.error('[Prisma] Error during $disconnect:', err.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Connection closed on SIGTERM');
  } catch (err) {
    console.error('[Prisma] Error during $disconnect:', err.message);
  }
  process.exit(0);
});

module.exports = prisma;

const prisma = require('../config/prisma');

// Drives the Payment / PaymentEvent tables via PrismaClient.
// This is the only repository in the project that uses Prisma; it satisfies
// T4 by combining typed CRUD (create / findUnique with include / update),
// a managed transaction ($transaction), and one tagged-template $queryRaw.
class PaymentRepository {
  // CRUD: create. Inserts a Payment in PENDING and writes a STATUS_CHANGE
  // event so the audit trail starts on row one.
  async create({ orderId, amount, method = 'CARD' }) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { orderId, amount, method, status: 'PENDING' },
      });
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'STATUS_CHANGE',
          payload: { from: null, to: 'PENDING', reason: 'created' },
        },
      });
      return payment;
    });
  }

  // CRUD: read with eager loading via `include` (T4 mentions include).
  async findById(id) {
    return await prisma.payment.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findByOrderId(orderId) {
    return await prisma.payment.findMany({
      where: { orderId },
      include: { events: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Managed transaction: update Payment.status AND append a PaymentEvent
  // atomically. Both rows commit together or both roll back.
  async transitionStatus(id, newStatus, eventPayload = {}) {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id } });
      if (!current) {
        const err = new Error('Payment not found');
        err.statusCode = 404;
        throw err;
      }
      const updated = await tx.payment.update({
        where: { id },
        data: { status: newStatus },
      });
      await tx.paymentEvent.create({
        data: {
          paymentId: id,
          type: 'STATUS_CHANGE',
          payload: { from: current.status, to: newStatus, ...eventPayload },
        },
      });
      return updated;
    });
  }

  // T4: $queryRaw with a tagged template literal. The `${status}` value is
  // automatically parameterised by Prisma's `sql` template tag — no string
  // concatenation, no SQL-injection surface.
  async countByStatus(status) {
    const rows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM "Payment"
      WHERE status = ${status}
    `;
    return Number(rows?.[0]?.total ?? 0);
  }
}

module.exports = PaymentRepository;

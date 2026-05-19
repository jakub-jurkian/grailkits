const prisma = require('../../config/prisma');

// Fixed UUIDs matching seed_orders.js so payment → order references are valid
const SEED_PAYMENTS = [
  {
    // Order 1 — PAID — has an AUTHORIZED payment
    id: 'e0000000-0000-0000-0000-000000000001',
    orderId: 'c0000000-0000-0000-0000-000000000001',
    amount: 89900,
    method: 'CARD',
    status: 'AUTHORIZED',
  },
  {
    // Order 2 — SHIPPED — has an AUTHORIZED payment
    id: 'e0000000-0000-0000-0000-000000000002',
    orderId: 'c0000000-0000-0000-0000-000000000002',
    amount: 225000,
    method: 'BLIK',
    status: 'AUTHORIZED',
  },
  {
    // Order 3 — PENDING — has a PENDING payment (not yet authorized)
    id: 'e0000000-0000-0000-0000-000000000003',
    orderId: 'c0000000-0000-0000-0000-000000000003',
    amount: 75000,
    method: 'CARD',
    status: 'PENDING',
  },
];

const SEED_PAYMENT_EVENTS = [
  // Payment 1 — created then authorized
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    paymentId: 'e0000000-0000-0000-0000-000000000001',
    type: 'STATUS_CHANGE',
    payload: { from: null, to: 'PENDING', reason: 'created' },
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    paymentId: 'e0000000-0000-0000-0000-000000000001',
    type: 'STATUS_CHANGE',
    payload: { from: 'PENDING', to: 'AUTHORIZED', reason: 'card_approved' },
  },
  // Payment 2 — created then authorized
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    paymentId: 'e0000000-0000-0000-0000-000000000002',
    type: 'STATUS_CHANGE',
    payload: { from: null, to: 'PENDING', reason: 'created' },
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    paymentId: 'e0000000-0000-0000-0000-000000000002',
    type: 'STATUS_CHANGE',
    payload: { from: 'PENDING', to: 'AUTHORIZED', reason: 'blik_approved' },
  },
  // Payment 3 — created only (still PENDING)
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    paymentId: 'e0000000-0000-0000-0000-000000000003',
    type: 'STATUS_CHANGE',
    payload: { from: null, to: 'PENDING', reason: 'created' },
  },
];

async function seedPayments() {
  const existing = await prisma.payment.count();
  if (existing > 0) {
    console.log('[Order Service] Payment seeds already present, skipping');
    return;
  }

  // Insert payments first, then events (FK: paymentEvent.paymentId → payment.id)
  for (const payment of SEED_PAYMENTS) {
    await prisma.payment.create({ data: payment });
  }

  for (const event of SEED_PAYMENT_EVENTS) {
    await prisma.paymentEvent.create({ data: event });
  }

  console.log('[Order Service] Payment seeds applied (3 payments, 5 events)');
}

module.exports = seedPayments;

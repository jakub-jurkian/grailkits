const { Order, OrderItem } = require('../../models');

// Fixed IDs matching the catalog-service seeds
const SEED_ORDERS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    userId: 'user-001',
    totalPrice: 89900,
    status: 'PAID',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    userId: 'user-002',
    totalPrice: 225000,
    status: 'SHIPPED',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    userId: 'user-001',
    totalPrice: 75000,
    status: 'PENDING',
  },
];

const SEED_ITEMS = [
  // Order 1 — user-001 bought Real Madrid M
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    orderId: 'c0000000-0000-0000-0000-000000000001',
    productId: 'a0000000-0000-0000-0000-000000000001',
    skuSnapshot: 'RM98-HOME-M',
    quantity: 1,
    unitPrice: 89900,
  },
  // Order 2 — user-002 bought Arsenal L + France M
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    orderId: 'c0000000-0000-0000-0000-000000000002',
    productId: 'a0000000-0000-0000-0000-000000000003',
    skuSnapshot: 'ARS89-HOME-L',
    quantity: 1,
    unitPrice: 150000,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    orderId: 'c0000000-0000-0000-0000-000000000002',
    productId: 'a0000000-0000-0000-0000-000000000004',
    skuSnapshot: 'FRA98-HOME-M',
    quantity: 1,
    unitPrice: 75000,
  },
  // Order 3 — user-001 pending Barcelona S
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    orderId: 'c0000000-0000-0000-0000-000000000003',
    productId: 'a0000000-0000-0000-0000-000000000002',
    skuSnapshot: 'BAR06-AWAY-S',
    quantity: 1,
    unitPrice: 75000,
  },
];

async function seedOrders() {
  const existing = await Order.count();
  if (existing > 0) {
    console.log('[Order Service] Seeds already present, skipping');
    return;
  }

  await Order.bulkCreate(SEED_ORDERS);
  await OrderItem.bulkCreate(SEED_ITEMS);
  console.log('[Order Service] Seeds applied');
}

module.exports = seedOrders;

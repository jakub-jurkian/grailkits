const request = require('supertest');
const { setupDB, teardownDB } = require('./setup');
const { createTestApp, createMockVariantRepo } = require('./testApp');

// ─── Shared variant fixtures ──────────────────────────────────────────────────

const VARIANTS = {
  'variant-001': {
    id: 'variant-001',
    product_id: 'product-001',
    price: '100.00',
    stock: 20,
    sku: 'SKU-001',
  },
  'variant-002': {
    id: 'variant-002',
    product_id: 'product-002',
    price: '50.00',
    stock: 10,
    sku: 'SKU-002',
  },
};

function makeApp(variantMap = VARIANTS, overrideRepo = null) {
  return createTestApp(variantMap, overrideRepo);
}

// Helper: add a line and checkout, returns the created order
async function placeOrder(app, userId, variantId = 'variant-001', quantity = 1) {
  await request(app)
    .post('/api/v1/cart/lines')
    .set('x-user-id', userId)
    .send({ variantId, quantity });

  const res = await request(app)
    .post('/api/v1/checkout')
    .set('x-user-id', userId);

  return res.body;
}

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await setupDB();
});

afterAll(async () => {
  await teardownDB();
});

// ─── GET /api/v1/orders ───────────────────────────────────────────────────────

describe('GET /api/v1/orders', () => {
  it('returns 200 with an empty array when the user has no orders', async () => {
    const app = makeApp();

    const res = await request(app)
      .get('/api/v1/orders')
      .set('x-user-id', 'user-no-orders');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns 200 with the list of orders for a user', async () => {
    const app = makeApp();
    const userId = 'user-list-orders';

    await placeOrder(app, userId, 'variant-001', 2);

    const res = await request(app)
      .get('/api/v1/orders')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0].userId).toBe(userId);
    expect(Array.isArray(res.body[0].items)).toBe(true);
  });

  it('returns 400 when x-user-id is missing', async () => {
    const app = makeApp();

    const res = await request(app).get('/api/v1/orders');

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/v1/orders/:id ───────────────────────────────────────────────────

describe('GET /api/v1/orders/:id', () => {
  it('returns 200 with order details for the owning user', async () => {
    const app = makeApp();
    const userId = 'user-get-by-id';

    const order = await placeOrder(app, userId, 'variant-001', 3);

    const res = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(order.id);
    expect(res.body.userId).toBe(userId);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('returns 404 for a non-existent order ID', async () => {
    const app = makeApp();

    const res = await request(app)
      .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
      .set('x-user-id', 'user-nobody');

    expect(res.status).toBe(404);
  });

  it('returns 403 when the order belongs to a different user', async () => {
    const app = makeApp();
    const ownerUserId = 'user-owner-403';
    const otherUserId = 'user-other-403';

    const order = await placeOrder(app, ownerUserId, 'variant-001', 1);

    const res = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('x-user-id', otherUserId);

    expect(res.status).toBe(403);
  });
});

// ─── POST /api/v1/orders/:id/cancel ──────────────────────────────────────────

describe('POST /api/v1/orders/:id/cancel', () => {
  it('returns 200 and sets status to CANCELLED', async () => {
    const app = makeApp();
    const userId = 'user-cancel-ok';

    const order = await placeOrder(app, userId, 'variant-001', 2);

    const res = await request(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('restores stock for each item after cancellation', async () => {
    const userId = 'user-cancel-stock';
    const variantId = 'variant-002';

    // Track stock calls via a custom mock repo
    const stockCalls = [];
    const variantMap = JSON.parse(JSON.stringify(VARIANTS));

    const trackingRepo = {
      async getVariantById(id) { return variantMap[id] || null; },
      async getVariantForUpdate(id) { return variantMap[id] || null; },
      async decrementStock(id, qty) {
        if (variantMap[id]) variantMap[id].stock -= qty;
      },
      async incrementStock(id, qty) {
        stockCalls.push({ id, qty });
        if (variantMap[id]) variantMap[id].stock += qty;
      },
    };

    const app = makeApp({}, trackingRepo);

    const order = await placeOrder(app, userId, variantId, 3);

    await request(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set('x-user-id', userId);

    // incrementStock should have been called once for variant-002 with qty=3
    expect(stockCalls).toHaveLength(1);
    expect(stockCalls[0].id).toBe(variantId);
    expect(stockCalls[0].qty).toBe(3);
  });

  it('returns 404 when the order does not exist', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/orders/00000000-0000-0000-0000-000000000000/cancel')
      .set('x-user-id', 'user-nobody');

    expect(res.status).toBe(404);
  });

  it('returns 403 when the order belongs to a different user', async () => {
    const app = makeApp();
    const ownerUserId = 'user-owner-cancel-403';
    const otherUserId = 'user-other-cancel-403';

    const order = await placeOrder(app, ownerUserId, 'variant-001', 1);

    const res = await request(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set('x-user-id', otherUserId);

    expect(res.status).toBe(403);
  });

  it('returns 409 when trying to cancel an already CANCELLED order', async () => {
    const app = makeApp();
    const userId = 'user-double-cancel';

    const order = await placeOrder(app, userId, 'variant-001', 1);

    // First cancel
    await request(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set('x-user-id', userId);

    // Second cancel — should be rejected
    const res = await request(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set('x-user-id', userId);

    expect(res.status).toBe(409);
  });
});

// ─── Order model domain hook ──────────────────────────────────────────────────

describe('beforeCreate domain hook — totalPrice guard', () => {
  it('returns 400 when order is created with zero totalPrice', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ userId: 'user-hook-test', items: [{ variantId: 'variant-001', quantity: 0, unitPrice: 0 }] });

    // quantity * unitPrice = 0 → totalPrice = 0 → hook throws
    expect(res.status).toBe(400);
  });

  it('returns 400 when order is created with negative totalPrice', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ userId: 'user-hook-test', items: [{ variantId: 'variant-001', quantity: 1, unitPrice: -50 }] });

    expect(res.status).toBe(400);
  });

  it('accepts an order with a positive totalPrice and rounds to 2dp', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ userId: 'user-hook-test', items: [{ productId: 'product-001', variantId: 'variant-001', quantity: 1, unitPrice: 99.999 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.totalPrice)).toBe(100.00);
  });
});

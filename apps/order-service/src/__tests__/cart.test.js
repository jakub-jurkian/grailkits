const request = require('supertest');
const { setupDB, teardownDB } = require('./setup');
const { createTestApp } = require('./testApp');

// ─── Shared variant fixtures ──────────────────────────────────────────────────

const VARIANTS = {
  'variant-001': {
    id: 'variant-001',
    product_id: 'product-001',
    price: 12000,
    stock: 10,
    sku: 'SKU-001',
  },
  'variant-002': {
    id: 'variant-002',
    product_id: 'product-002',
    price: 8000,
    stock: 3,
    sku: 'SKU-002',
  },
};

// Each test gets a fresh app instance (fresh mock stock) to avoid state bleed
function makeApp(variantMap = VARIANTS, overrideRepo = null) {
  return createTestApp(variantMap, overrideRepo);
}

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await setupDB();
});

afterAll(async () => {
  await teardownDB();
});

// ─── POST /api/v1/cart/lines ──────────────────────────────────────────────────

describe('POST /api/v1/cart/lines', () => {
  it('returns 200 and creates a cart with the new line', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', 'user-add-1')
      .send({ variantId: 'variant-001', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.userId).toBe('user-add-1');
    expect(res.body.status).toBe('OPEN');
    expect(Array.isArray(res.body.lines)).toBe(true);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0].variantId).toBe('variant-001');
    expect(res.body.lines[0].quantity).toBe(2);
  });

  it('returns 400 when required fields are missing', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', 'user-bad-req')
      .send({}); // no variantId or quantity

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when the variant does not exist', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', 'user-no-variant')
      .send({ variantId: 'does-not-exist', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 409 when requested quantity exceeds available stock', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', 'user-overstock')
      .send({ variantId: 'variant-001', quantity: 999 });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/stock/i);
  });

  it('merges quantity when the same variant is added to an existing cart', async () => {
    const app = makeApp();
    const userId = 'user-merge';

    await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-001', quantity: 1 });

    const res = await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-001', quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0].quantity).toBe(4); // 1 + 3
  });
});

// ─── GET /api/v1/cart ─────────────────────────────────────────────────────────

describe('GET /api/v1/cart', () => {
  it('returns 200 with the open cart and its lines', async () => {
    const app = makeApp();
    const userId = 'user-get-cart';

    await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-002', quantity: 2 });

    const res = await request(app)
      .get('/api/v1/cart')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(userId);
    expect(res.body.status).toBe('OPEN');
    expect(Array.isArray(res.body.lines)).toBe(true);
    expect(res.body.lines.length).toBeGreaterThan(0);
  });

  it('returns 404 when the user has no open cart', async () => {
    const app = makeApp();

    const res = await request(app)
      .get('/api/v1/cart')
      .set('x-user-id', 'user-no-cart-at-all');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when x-user-id header is missing', async () => {
    const app = makeApp();

    const res = await request(app).get('/api/v1/cart');

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/v1/checkout ────────────────────────────────────────────────────

describe('POST /api/v1/checkout', () => {
  it('returns 201 with a PENDING order and correct totalPrice', async () => {
    const app = makeApp();
    const userId = 'user-checkout-ok';

    // variant-001 price = 12000, qty = 2 → total = 24000 (grosze)
    await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-001', quantity: 2 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('x-user-id', userId);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PENDING');
    expect(Number(res.body.totalPrice)).toBe(24000);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].skuSnapshot).toBe('SKU-001');
    expect(res.body.items[0].quantity).toBe(2);
  });

  it('marks the cart as CHECKED_OUT after a successful checkout', async () => {
    const app = makeApp();
    const userId = 'user-cart-status';

    await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-001', quantity: 1 });

    await request(app)
      .post('/api/v1/checkout')
      .set('x-user-id', userId);

    // Cart is now CHECKED_OUT → GET /cart should return 404
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('x-user-id', userId);

    expect(cartRes.status).toBe(404);
  });

  it('returns 400 when the user has no open cart', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('x-user-id', 'user-no-cart-checkout');

    expect(res.status).toBe(400);
  });

  it('returns 409 when stock is depleted between cart add and checkout (race condition)', async () => {
    const userId = 'user-race';

    // variant-race: getVariantById returns stock=5 (add to cart passes),
    // but getVariantForUpdate returns stock=0 (another buyer cleared it)
    const raceVariant = {
      id: 'variant-race',
      product_id: 'product-race',
      price: '50.00',
      stock: 5,
      sku: 'SKU-RACE',
    };

    const racingRepo = {
      async getVariantById() { return raceVariant; },
      async getVariantForUpdate() { return { ...raceVariant, stock: 0 }; },
      async decrementStock() {},
    };

    const app = makeApp({}, racingRepo);

    await request(app)
      .post('/api/v1/cart/lines')
      .set('x-user-id', userId)
      .send({ variantId: 'variant-race', quantity: 2 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('x-user-id', userId);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/stock/i);
  });
});

const request = require('supertest');
const { pool, setupDB, teardownDB } = require('./setup');
const createTestApp = require('./testApp');

let app;

beforeAll(async () => {
  await setupDB();
  app = createTestApp(pool);
});

afterAll(async () => {
  await teardownDB();
});

// ─── GET /api/v1/categories ──────────────────────────────────────────────────

describe('GET /api/v1/categories', () => {
  it('returns 200 with an array of categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
  });
});

// ─── GET /api/v1/products ────────────────────────────────────────────────────

describe('GET /api/v1/products', () => {
  it('returns 200 with an array of products including variants', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const product = res.body[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('variants');
    expect(Array.isArray(product.variants)).toBe(true);
  });

  it('filters by categoryId', async () => {
    // Get categories first to find a valid ID
    const catRes = await request(app).get('/api/v1/categories');
    const categoryId = catRes.body[0].id;

    const res = await request(app).get(`/api/v1/products?categoryId=${categoryId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filters by price range', async () => {
    const res = await request(app).get('/api/v1/products?minPrice=70000&maxPrice=100000');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Every returned variant must be within the price range
    res.body.forEach((product) => {
      product.variants.forEach((variant) => {
        expect(Number(variant.price)).toBeGreaterThanOrEqual(70000);
        expect(Number(variant.price)).toBeLessThanOrEqual(100000);
      });
    });
  });

  it('returns only products with stock when available=true (default)', async () => {
    const res = await request(app).get('/api/v1/products?available=true');
    expect(res.status).toBe(200);
    res.body.forEach((product) => {
      product.variants.forEach((variant) => {
        expect(Number(variant.stock)).toBeGreaterThan(0);
      });
    });
  });
});

// ─── GET /api/v1/products/:id ────────────────────────────────────────────────

describe('GET /api/v1/products/:id', () => {
  it('returns 200 with product details for a valid seed UUID', async () => {
    const seedId = 'a0000000-0000-0000-0000-000000000001'; // Real Madrid 1998
    const res = await request(app).get(`/api/v1/products/${seedId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(seedId);
    expect(res.body.name).toBe('Real Madrid 1998 Home');
  });

  it('returns 404 for a non-existent product ID', async () => {
    const res = await request(app).get(
      '/api/v1/products/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/v1/products/count ──────────────────────────────────────────────

describe('GET /api/v1/products/count', () => {
  it('returns 200 with total product count', async () => {
    const res = await request(app).get('/api/v1/products/count');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');
    expect(res.body.total).toBe(5); // 5 seeded products
  });
});

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

// ─── GET /api/v1/products/search (T5: $text + $search) ──────────────────────

describe('GET /api/v1/products/search', () => {
  it('returns 400 when the q query parameter is missing', async () => {
    const res = await request(app).get('/api/v1/products/search');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 when q is shorter than 2 characters', async () => {
    const res = await request(app).get('/api/v1/products/search?q=a');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 200 with results when q is valid (stub returns empty list)', async () => {
    const res = await request(app).get('/api/v1/products/search?q=Madrid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('forwards the trimmed q string to the repository ($text/$search)', async () => {
    const calls = [];
    const customApp = createTestApp(pool, {
      searchByText: async (term) => {
        calls.push(term);
        return [{ _id: 'fake', productId: 'p-1', score: 1.2 }];
      },
    });

    const res = await request(customApp).get('/api/v1/products/search?q=  Real  ');
    expect(res.status).toBe(200);
    expect(calls).toEqual(['Real']);
    expect(res.body[0].score).toBe(1.2);
  });

  it('is registered BEFORE /:id so "search" is not treated as a product id', async () => {
    // If routing order were wrong, this would hit getProductDetails with id="search"
    // and return 404 (since no such UUID exists). 200 here confirms the search handler ran.
    const res = await request(app).get('/api/v1/products/search?q=Barcelona');
    expect(res.status).toBe(200);
  });
});

// ─── PATCH /api/v1/products/:id/details (T5: $set + whitelist) ──────────────

describe('PATCH /api/v1/products/:id/details', () => {
  const PRODUCT_ID = 'a0000000-0000-0000-0000-000000000001';

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 when body contains no whitelisted fields', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({ unknownField: 'foo', anotherWild: 42 });
    expect(res.status).toBe(400);
  });

  it('drops Mongo query operators from the body (whitelist guard)', async () => {
    // $inc and $set in the body should never reach the repository.
    // Whitelist only keeps longDescription, so the call should succeed
    // with patch === { longDescription: '...' } and no operator keys.
    let received = null;
    const customApp = createTestApp(pool, {
      updateByProductId: async (_id, patch) => {
        received = patch;
        return true;
      },
    });

    const res = await request(customApp)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({
        longDescription: 'New description',
        $set: { stolen: 'data' },
        $inc: { counter: 1 },
      });

    expect(res.status).toBe(200);
    expect(received).toEqual({ longDescription: 'New description' });
    expect(received).not.toHaveProperty('$set');
    expect(received).not.toHaveProperty('$inc');
  });

  it('returns 400 when longDescription is not a string', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({ longDescription: 123 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when specs is an array instead of a plain object', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({ specs: ['not', 'an', 'object'] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when gallery is not an array', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({ gallery: 'https://only-one.jpg' });
    expect(res.status).toBe(400);
  });

  it('returns 200 and echoes the applied patch on a successful update', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({
        longDescription: 'Updated long description',
        specs: { manufacturer: 'Adidas' },
      });
    expect(res.status).toBe(200);
    expect(res.body.productId).toBe(PRODUCT_ID);
    expect(res.body.updated.longDescription).toBe('Updated long description');
    expect(res.body.updated.specs).toEqual({ manufacturer: 'Adidas' });
  });

  it('returns 404 when no product_details document matches the productId', async () => {
    const customApp = createTestApp(pool, {
      updateByProductId: async () => false, // simulate "no doc to update"
    });

    const res = await request(customApp)
      .patch(`/api/v1/products/${PRODUCT_ID}/details`)
      .send({ longDescription: 'whatever' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

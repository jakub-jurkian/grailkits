const request = require('supertest');
const { setupMongo, clearCollections, teardownMongo } = require('./setup');
const { createTestApp, createMockProductStatsRepo } = require('./testApp');

const app = createTestApp();

const VALID_REVIEW = {
  productId: 'a0000000-0000-0000-0000-000000000001',
  userId: 'user-001',
  rating: 5,
  title: 'Absolute grail',
  body: 'One of the finest shirts I have ever owned. Worth every penny.',
};

beforeAll(async () => {
  await setupMongo();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await teardownMongo();
});

// ─── POST /api/v1/reviews ────────────────────────────────────────────────────

describe('POST /api/v1/reviews', () => {
  it('creates a review and returns 201 with the saved document', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .send(VALID_REVIEW);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      productId: VALID_REVIEW.productId,
      userId: VALID_REVIEW.userId,
      rating: VALID_REVIEW.rating,
      title: VALID_REVIEW.title,
    });
    expect(res.body._id).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const { title, ...noTitle } = VALID_REVIEW;
    const res = await request(app).post('/api/v1/reviews').send(noTitle);
    expect(res.status).toBe(400);
  });

  it('returns 400 when body contains HTML tags', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .send({ ...VALID_REVIEW, body: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .send({ ...VALID_REVIEW, rating: 6 });
    expect(res.status).toBe(400);
  });

  it('pre-save hook populates moderationHistory on creation', async () => {
    const res = await request(app).post('/api/v1/reviews').send(VALID_REVIEW);
    expect(res.status).toBe(201);
    expect(res.body.moderationHistory).toHaveLength(1);
    expect(res.body.moderationHistory[0].status).toBe('PENDING');
  });
});

// ─── GET /api/v1/reviews/product/:productId ──────────────────────────────────

describe('GET /api/v1/reviews/product/:productId', () => {
  it('returns 200 with an array of reviews for the product', async () => {
    await request(app).post('/api/v1/reviews').send(VALID_REVIEW);

    const res = await request(app)
      .get(`/api/v1/reviews/product/${VALID_REVIEW.productId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].productId).toBe(VALID_REVIEW.productId);
  });

  it('returns empty array when no reviews exist for the product', async () => {
    const res = await request(app)
      .get('/api/v1/reviews/product/nonexistent-product-id');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns reviews sorted by createdAt descending', async () => {
    await request(app).post('/api/v1/reviews').send({ ...VALID_REVIEW, title: 'First review', rating: 3 });
    await request(app).post('/api/v1/reviews').send({ ...VALID_REVIEW, title: 'Second review', rating: 5 });

    const res = await request(app)
      .get(`/api/v1/reviews/product/${VALID_REVIEW.productId}`);

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Second review');
  });
});

// ─── GET /api/v1/reviews/analytics/avg-rating ────────────────────────────────

describe('GET /api/v1/reviews/analytics/avg-rating', () => {
  it('returns 200 with aggregated avg rating per product', async () => {
    const first = await request(app).post('/api/v1/reviews').send({ ...VALID_REVIEW, rating: 4 });
    const second = await request(app).post('/api/v1/reviews').send({ ...VALID_REVIEW, rating: 2 });

    await request(app)
      .patch(`/api/v1/reviews/${first.body._id}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Ok' });
    await request(app)
      .patch(`/api/v1/reviews/${second.body._id}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Ok' });

    const res = await request(app)
      .get('/api/v1/reviews/analytics/avg-rating');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].avgRating).toBe(3);
    expect(res.body[0].reviewCount).toBe(2);
  });

  it('filters by productId when provided as query param', async () => {
    const created = await request(app).post('/api/v1/reviews').send(VALID_REVIEW);
    await request(app)
      .patch(`/api/v1/reviews/${created.body._id}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Ok' });
    await request(app).post('/api/v1/reviews').send({
      ...VALID_REVIEW,
      productId: 'a0000000-0000-0000-0000-000000000002',
    });

    const res = await request(app)
      .get(`/api/v1/reviews/analytics/avg-rating?productId=${VALID_REVIEW.productId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].productId).toBe(VALID_REVIEW.productId);
  });
});

// ─── GET /api/v1/reviews/approved ────────────────────────────────────────────

describe('GET /api/v1/reviews/approved', () => {
  it('returns only APPROVED reviews', async () => {
    const created = await request(app).post('/api/v1/reviews').send(VALID_REVIEW);
    await request(app)
      .patch(`/api/v1/reviews/${created.body._id}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Looks good' });
    await request(app).post('/api/v1/reviews').send(VALID_REVIEW);

    const res = await request(app).get('/api/v1/reviews/approved');

    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.status === 'APPROVED')).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('filters by productId when provided', async () => {
    const created = await request(app).post('/api/v1/reviews').send(VALID_REVIEW);
    await request(app)
      .patch(`/api/v1/reviews/${created.body._id}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Ok' });
    await request(app).post('/api/v1/reviews').send({
      ...VALID_REVIEW,
      productId: 'a0000000-0000-0000-0000-000000000002',
    });

    const res = await request(app)
      .get(`/api/v1/reviews/approved?productId=${VALID_REVIEW.productId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].productId).toBe(VALID_REVIEW.productId);
  });
});

// ─── PATCH /api/v1/reviews/:id/moderate ──────────────────────────────────────

describe('PATCH /api/v1/reviews/:id/moderate', () => {
  const PENDING_REVIEW = {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-001',
    rating: 4,
    title: 'Great kit',
    body: 'Arrived on time and fits well.',
  };

  it('approves a PENDING review and returns 200 with APPROVED status', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    expect(created.status).toBe(201);
    const reviewId = created.body._id;

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  it('rejects a PENDING review and returns 200 with REJECTED status', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'REJECTED', reason: 'Spam content' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
  });

  it('appends a moderationHistory entry with moderatorId and reason', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001', reason: 'All good' });

    expect(res.status).toBe(200);
    const history = res.body.moderationHistory;
    const approvalEntry = history.find((e) => e.status === 'APPROVED');
    expect(approvalEntry).toBeDefined();
    expect(approvalEntry.moderatorId).toBe('mod-001');
    expect(approvalEntry.reason).toBe('All good');
  });

  it('returns 404 for a non-existent review ID', async () => {
    const fakeId = '000000000000000000000001';
    const res = await request(app)
      .patch(`/api/v1/reviews/${fakeId}/moderate`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 409 when review is already moderated', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'APPROVED' });

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('returns 400 when status field is missing', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ moderatorId: 'mod-001' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 when status is an invalid value', async () => {
    const created = await request(app).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(app)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'PENDING' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });
});

// ─── Hybrid write-back: approve → PostgreSQL stats update ────────────────────

describe('PATCH /api/v1/reviews/:id/moderate — hybrid PG write-back', () => {
  const PENDING_REVIEW = {
    productId: 'a0000000-0000-0000-0000-000000000099',
    userId: 'user-001',
    rating: 4,
    title: 'Hybrid test review',
    body: 'Testing hybrid write-back to PostgreSQL.',
    status: 'PENDING',
  };

  it('calls productStatsRepository.updateReviewStats with correct productId and stats on approval', async () => {
    const statsRepo = createMockProductStatsRepo();
    const hybridApp = createTestApp({ productStatsRepo: statsRepo });

    const created = await request(hybridApp).post('/api/v1/reviews').send(PENDING_REVIEW);
    expect(created.status).toBe(201);
    const reviewId = created.body._id;

    const res = await request(hybridApp)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'APPROVED', moderatorId: 'mod-001' });

    expect(res.status).toBe(200);
    expect(statsRepo.calls).toHaveLength(1);
    expect(statsRepo.calls[0].productId).toBe(PENDING_REVIEW.productId);
    expect(typeof statsRepo.calls[0].reviewCount).toBe('number');
    expect(statsRepo.calls[0].reviewCount).toBeGreaterThan(0);
  });

  it('does NOT call productStatsRepository on REJECTED moderation', async () => {
    const statsRepo = createMockProductStatsRepo();
    const hybridApp = createTestApp({ productStatsRepo: statsRepo });

    const created = await request(hybridApp).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(hybridApp)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(200);
    expect(statsRepo.calls).toHaveLength(0);
  });

  it('reverts MongoDB status to PENDING and returns 503 when PG write-back fails', async () => {
    const failingStatsRepo = createMockProductStatsRepo({ shouldFail: true });
    const hybridApp = createTestApp({ productStatsRepo: failingStatsRepo });

    const created = await request(hybridApp).post('/api/v1/reviews').send(PENDING_REVIEW);
    const reviewId = created.body._id;

    const res = await request(hybridApp)
      .patch(`/api/v1/reviews/${reviewId}/moderate`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('INTERNAL_ERROR');

    // Verify MongoDB document was compensated back to PENDING
    const listRes = await request(hybridApp)
      .get(`/api/v1/reviews/product/${PENDING_REVIEW.productId}`);
    expect(listRes.status).toBe(200);
    const review = listRes.body.find((r) => r._id === reviewId);
    expect(review.status).toBe('PENDING');
  });
});

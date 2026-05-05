// Builds the Express app without calling listen() or connecting to real MongoDB.
// Used exclusively in tests — Mongoose connection is managed by setup.js.
const express = require('express');
const ReviewRepository = require('../repositories/review.repository');
const ReviewService = require('../services/review.service');
const ReviewController = require('../controllers/review.controller');

// In-memory mock for ProductStatsRepository.
// Captures calls so tests can assert on what was written to "PG".
function createMockProductStatsRepo({ shouldFail = false } = {}) {
  const calls = [];
  return {
    calls,
    async updateReviewStats(productId, stats) {
      if (shouldFail) throw new Error('PG connection refused (simulated)');
      calls.push({ productId, ...stats });
    },
  };
}

function createTestApp({ productStatsRepo } = {}) {
  const app = express();
  app.use(express.json());

  const reviewRepository = new ReviewRepository();
  const reviewService = new ReviewService(reviewRepository, productStatsRepo || null);
  const reviewController = new ReviewController(reviewService);

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.post('/api/v1/reviews', reviewController.createReview);
  app.get('/api/v1/reviews/product/:productId', reviewController.getProductReviews);
  app.get('/api/v1/reviews/analytics/avg-rating', reviewController.getAvgRatingAnalytics);
  app.get('/api/v1/reviews/approved', reviewController.getApprovedReviews);
  app.patch('/api/v1/reviews/:id/moderate', reviewController.moderateReview);

  return app;
}

module.exports = { createTestApp, createMockProductStatsRepo };

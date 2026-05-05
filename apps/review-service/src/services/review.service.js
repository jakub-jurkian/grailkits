const VALID_STATUSES = ['APPROVED', 'REJECTED'];

class ReviewService {
  // productStatsRepository is optional — omit in tests or when DATABASE_URL is absent.
  constructor(reviewRepository, productStatsRepository = null) {
    this.reviewRepository = reviewRepository;
    this.productStatsRepository = productStatsRepository;
  }

  async addReview(data) {
    return await this.reviewRepository.create(data);
  }

  async getReviewsForProduct(productId) {
    return await this.reviewRepository.findByProductId(productId);
  }

  async getAvgRatingAnalytics(productId) {
    return await this.reviewRepository.aggregateAvgRatingPerProduct(productId);
  }

  async getApprovedReviews(productId) {
    return await this.reviewRepository.getApprovedReviews(productId);
  }

  async moderateReview(reviewId, { status, moderatorId, reason }) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid moderation status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found');
      err.statusCode = 404;
      throw err;
    }

    if (review.status !== 'PENDING') {
      const err = new Error(`Review has already been moderated (status: ${review.status})`);
      err.statusCode = 409;
      throw err;
    }

    // Step 1 — persist the new status in MongoDB
    const updatedReview = await this.reviewRepository.moderateReview(
      reviewId,
      { status, moderatorId, reason }
    );

    // Step 2 — if approved and a PG stats repo is wired, update the products table.
    // On failure we compensate by reverting the MongoDB document back to PENDING.
    if (status === 'APPROVED' && this.productStatsRepository) {
      try {
        const stats = await this._computeApprovedStats(review.productId);
        await this.productStatsRepository.updateReviewStats(review.productId, stats);
      } catch (pgError) {
        // Compensation: revert MongoDB status to PENDING so the two stores stay consistent
        console.error('[ReviewService] PG write-back failed — reverting MongoDB status:', pgError.message);
        await this.reviewRepository.moderateReview(reviewId, {
          status: 'PENDING',
          moderatorId: 'system',
          reason: `Compensation: PG write-back failed — ${pgError.message}`,
        });

        const err = new Error('Review approval failed: could not update product statistics');
        err.statusCode = 503;
        err.details = pgError.message;
        throw err;
      }
    }

    return updatedReview;
  }

  // Recalculates avg_rating and review_count for a product using approved reviews in MongoDB.
  async _computeApprovedStats(productId) {
    const results = await this.reviewRepository.aggregateAvgRatingPerProduct(productId);
    const stats = results.find((r) => r.productId === productId);
    return {
      avgRating: stats ? stats.avgRating : null,
      reviewCount: stats ? stats.reviewCount : 0,
    };
  }
}

module.exports = ReviewService;

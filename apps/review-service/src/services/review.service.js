const VALID_STATUSES = ['APPROVED', 'REJECTED'];

class ReviewService {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
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

    return await this.reviewRepository.moderateReview(reviewId, { status, moderatorId, reason });
  }
}

module.exports = ReviewService;

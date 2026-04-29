class ReviewService {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async addReview(data) {
    // validation later
    return await this.reviewRepository.create(data);
  }

  async getReviewsForProduct(productId) {
    return await this.reviewRepository.findByProductId(productId);
  }

  async getAvgRatingAnalytics(productId) {
    return await this.reviewRepository.aggregateAvgRatingPerProduct(productId);
  }
}

module.exports = ReviewService;
const { errorResponse } = require('../utils/errors');

class ReviewController {
  constructor(reviewService) {
    this.reviewService = reviewService;
    this.createReview = this.createReview.bind(this);
    this.getProductReviews = this.getProductReviews.bind(this);
    this.getAvgRatingAnalytics = this.getAvgRatingAnalytics.bind(this);
    this.getApprovedReviews = this.getApprovedReviews.bind(this);
    this.moderateReview = this.moderateReview.bind(this);
  }

  async createReview(req, res) {
    try {
      const body = req.body || {};
      const review = await this.reviewService.addReview({
        productId: body.productId,
        userId: body.userId,
        rating: body.rating,
        title: body.title,
        body: body.body,
      });
      res.status(201).json(review);
    } catch (error) {
      console.error('[ReviewController] Error creating review:', error);
      if (!error.statusCode) error.statusCode = 400;
      errorResponse(res, error);
    }
  }

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await this.reviewService.getReviewsForProduct(productId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('[ReviewController] Error fetching reviews:', error);
      errorResponse(res, error);
    }
  }

  async getApprovedReviews(req, res) {
    try {
      const { productId } = req.query;
      const reviews = await this.reviewService.getApprovedReviews(productId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('[ReviewController] Error fetching approved reviews:', error);
      errorResponse(res, error);
    }
  }

  async getAvgRatingAnalytics(req, res) {
    try {
      const { productId } = req.query;
      const analytics = await this.reviewService.getAvgRatingAnalytics(productId);
      res.status(200).json(analytics);
    } catch (error) {
      console.error('[ReviewController] Error fetching rating analytics:', error);
      errorResponse(res, error);
    }
  }

  async moderateReview(req, res) {
    try {
      const { id } = req.params;
      const { status, moderatorId, reason } = req.body;

      if (!status) {
        const err = Object.assign(new Error('Missing required field: status'), { statusCode: 400 });
        return errorResponse(res, err);
      }

      const review = await this.reviewService.moderateReview(id, { status, moderatorId, reason });
      res.status(200).json(review);
    } catch (error) {
      console.error('[ReviewController] Error moderating review:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = ReviewController;

class ReviewController {
  constructor(reviewService) {
    this.reviewService = reviewService;

    // bind the context to prevent undefined error
    this.createReview = this.createReview.bind(this);
    this.getProductReviews = this.getProductReviews.bind(this);
  }

  async createReview(req, res) {
    try {
      const review = await this.reviewService.addReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      console.error('[ReviewController] Error creating review:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await this.reviewService.getReviewsForProduct(productId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('[ReviewController] Error fetching reviews:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = ReviewController;
const Review = require("../models/review.model");

class ReviewRepository {
  async create(reviewData) {
    const review = new Review(reviewData);
    return await review.save(); // mongoose use save method to save new doc
  }

  async findByProductId(productId) {
    return await Review.find({ productId }).sort({ createdAt: -1 }); // searching by the latest
  }
}

module.exports = ReviewRepository;
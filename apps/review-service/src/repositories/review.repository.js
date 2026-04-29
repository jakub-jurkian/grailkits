const Review = require("../models/review.model");

class ReviewRepository {
  async create(reviewData) {
    const review = new Review(reviewData);
    return await review.save(); // mongoose use save method to save new doc
  }

  async findByProductId(productId) {
    return await Review.find({ productId }).sort({ createdAt: -1 }); // searching by the latest
  }

  async aggregateAvgRatingPerProduct(productId) {
    const matchStage = {
      status: 'APPROVED',
    };

    if (productId) {
      matchStage.productId = productId;
    }

    return await Review.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          reviewCount: 1,
        },
      },
      {
        $lookup: {
          from: "product_details",
          localField: "productId",
          foreignField: "productId",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
    ]);
  }
}

module.exports = ReviewRepository;
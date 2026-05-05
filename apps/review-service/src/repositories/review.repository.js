const Review = require("../models/review.model");

class ReviewRepository {
  async create(reviewData) {
    const review = new Review(reviewData);
    return await review.save(); // mongoose use save method to save new doc
  }

  async findByProductId(productId) {
    return await Review
      .find({ productId })
      .sort({ createdAt: -1 })
      .populate('productDetails');  // T6: populate virtual with ProductDetail document
  }

  async getApprovedReviews(productId) {
    return await Review.getApproved(productId);
  }

  async findById(reviewId) {
    return await Review.findById(reviewId);
  }

  async moderateReview(reviewId, { status, moderatorId, reason }) {
    const review = await Review.findById(reviewId);
    if (!review) return null;

    review.status = status;

    // Append explicit moderation entry (pre-save hook also tracks changes,
    // but we enrich it with moderatorId + reason here)
    review.moderationHistory.push({
      status,
      moderatorId: moderatorId || null,
      reason: reason || null,
      createdAt: new Date(),
    });

    // Disable the pre-save hook's auto-push for this save so we don't double-append.
    // We mark the history as already updated by temporarily overriding isModified.
    // Simpler approach: mark a flag the pre-save hook checks.
    review._skipModerationHistoryPush = true;

    return await review.save();
  }

  async aggregateAvgRatingPerProduct(productId) {
    const matchStage = { status: 'APPROVED' };
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

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const seedReviews = require("./db/seeds/seed_reviews");
const ReviewRepository = require("./repositories/review.repository");
const ProductStatsRepository = require("./repositories/product-stats.repository");
const ReviewService = require("./services/review.service");
const ReviewController = require("./controllers/review.controller");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Review Service is operational' });
});

// Initialize Database Connection and seed
const initDB = async () => {
  await connectDB();
  try {
    await seedReviews();
  } catch (err) {
    console.error('[Review Service] Seeding failed (non-fatal):', err.message);
  }
};
initDB();

// Initialize DI (Java-way)
const reviewRepository = new ReviewRepository();
// Wire PG stats repo only when DATABASE_URL is present (skipped in test env)
const productStatsRepository = process.env.DATABASE_URL
  ? new ProductStatsRepository()
  : null;
const reviewService = new ReviewService(reviewRepository, productStatsRepository);
const reviewController = new ReviewController(reviewService);

// Routes
app.post("/api/v1/reviews", reviewController.createReview);
app.get(
  "/api/v1/reviews/product/:productId",
  reviewController.getProductReviews,
);
app.get(
  "/api/v1/reviews/analytics/avg-rating",
  reviewController.getAvgRatingAnalytics,
);
app.get(
  "/api/v1/reviews/approved",
  reviewController.getApprovedReviews,
);
app.patch(
  "/api/v1/reviews/:id/moderate",
  reviewController.moderateReview,
);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Catalog Service is operational" });
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[Review Service] Server is running on port ${PORT}`);
});

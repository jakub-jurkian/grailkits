require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const ReviewRepository = require("./repositories/review.repository");
const ReviewService = require("./services/review.service");
const ReviewController = require("./controllers/review.controller");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Connection
connectDB();

// Initialize DI (Java-way)
const reviewRepository = new ReviewRepository();
const reviewService = new ReviewService(reviewRepository);
const reviewController = new ReviewController(reviewService);

// Routes
app.post("/api/v1/reviews", reviewController.createReview);
app.get(
  "/api/v1/reviews/product/:productId",
  reviewController.getProductReviews,
);

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[Review Service] Server is running on port ${PORT}`);
});

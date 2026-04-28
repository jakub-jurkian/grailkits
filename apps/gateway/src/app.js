require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Global CORS Configuration - the Gateway handles CORS for the entire system, so microservices don't strictly have to.
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "API Gateway is operational" });
});

// Proxy Rules
// Route requests to the Catalog Service
app.use(
  "/api/v1/catalog",
  createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      // Preserve the downstream API prefix; default catalog root to product listing.
      if (path === "/" || path === "") {
        return "/api/v1/products";
      }
      return `/api/v1${path}`;
    },
  }),
);

// Route requests to the Review Service
app.use(
  "/api/v1/reviews",
  createProxyMiddleware({
    target: process.env.REVIEW_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") {
        return "/api/v1/reviews";
      }
      return `/api/v1/reviews${path}`;
    },
  }),
);

// Route requests to the Order Service
app.use(
  "/api/v1/orders",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") {
        return "/api/v1/orders";
      }
      return `/api/v1/orders${path}`;
    },
  }),
);

// Start the Gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API Gateway] Central entry point running on port ${PORT}`);
});

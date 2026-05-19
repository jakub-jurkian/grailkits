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
// External prefix /api/v1/products maps 1:1 to catalog-service internal routes - no rewrite needed
app.use(
  "/api/v1/products",
  createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
  }),
);

// Route requests to the Review Service
app.use(
  "/api/v1/reviews",
  createProxyMiddleware({
    target: process.env.REVIEW_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      const [pathname, qs] = path.split("?");
      const query = qs ? `?${qs}` : "";

      if (pathname.startsWith("/api/v1/reviews")) {
        return `${pathname}${query}`;
      }
      if (pathname === "/" || pathname === "") {
        return `/api/v1/reviews${query}`;
      }
      return `/api/v1/reviews${pathname}${query}`;
    },
  }),
);

// Route requests to the Order Service - orders, cart, and checkout
const orderProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => {
    const [pathname, qs] = path.split("?");
    const query = qs ? `?${qs}` : "";

    if (pathname === "/" || pathname === "") {
      return `/api/v1/orders${query}`;
    }
    return `/api/v1${pathname}${query}`;
  },
});

app.use("/api/v1/orders", orderProxy);
app.use("/api/v1/cart", orderProxy);
app.use("/api/v1/checkout", orderProxy);

// Route requests to the Order Service (Payment endpoints owned by Prisma).
// External prefix /api/v1/payments maps 1:1 to the order-service internal
// routes (GET /payments/count, GET /payments/:id, POST /payments/:id/authorize,
// POST /payments/:id/fail) - no rewrite needed. The create-payment endpoint
// is nested under /api/v1/orders/:id/payment and reaches order-service through
// the existing orderProxy above, so no extra rule for it.
app.use(
  "/api/v1/payments",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
  }),
);

// Start the Gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API Gateway] Central entry point running on port ${PORT}`);
});

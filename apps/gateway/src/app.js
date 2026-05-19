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
  "/api/v1/products",
  createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") return "/api/v1/products";
      return `/api/v1/products${path}`;
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

// Route requests to the Order Service
// Each mount needs its own proxy so pathRewrite can restore the correct prefix
// (Express strips the mount path from req.url before passing to the middleware).
app.use(
  "/api/v1/orders",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") return "/api/v1/orders";
      return `/api/v1/orders${path}`;
    },
  }),
);

app.use(
  "/api/v1/cart",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") return "/api/v1/cart";
      return `/api/v1/cart${path}`;
    },
  }),
);

app.use(
  "/api/v1/checkout",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: () => "/api/v1/checkout",
  }),
);
app.use(
  "/api/v1/payments",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      if (path === "/" || path === "") return "/api/v1/payments";
      return `/api/v1/payments${path}`;
    },
  }),
);

// Start the Gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API Gateway] Central entry point running on port ${PORT}`);
});

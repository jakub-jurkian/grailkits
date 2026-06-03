require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");

const app = express();

// Global CORS Configuration - the Gateway handles CORS for the entire system, so microservices don't strictly have to.
app.use(cors());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("connect", () =>
  console.log("Successfully connected to Redis for Rate Limiting"),
);
redisClient.on("error", (err) => console.error("Redis connection error:", err));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true, // returns `RateLimit-Limit` and `RateLimit-Remaining`
  legacyHeaders: false, // turns off legacy headers X-RateLimit-*

  // use Redis instead of Express RAM
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),

  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      error: "Too Many Requests",
      message: "Slown down! Rate limit exceeded. Try again in 15 min.",
    });
  },
});

app.use(limiter);

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
const server = app.listen(PORT, () => {
  console.log(`[API Gateway] Central entry point running on port ${PORT}`);
});

// Graceful shutdown — handle SIGTERM (docker compose down) and SIGINT (Ctrl+C)
const shutdown = async (signal) => {
  console.log(`[API Gateway] ${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('[API Gateway] HTTP server closed');
  });
  await redisClient.quit();
  console.log('[API Gateway] Redis connection closed');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

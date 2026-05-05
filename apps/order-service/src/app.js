require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize, connectDB } = require("./config/db");
const seedOrders = require("./db/seeds/seed_orders");
const OrderRepository = require("./repositories/order.repository");
const CartRepository = require("./repositories/cart.repository");
const VariantRepository = require("./repositories/variant.repository");
const OrderService = require("./services/order.service");
const CartService = require("./services/cart.service");
const OrderController = require("./controllers/order.controller");
const CartController = require("./controllers/cart.controller");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Order Service is operational' });
});

// Start listening immediately so the health check can pass
// while DB sync runs in the background
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`[Order Service] Server is running on port ${PORT}`);
});

const startServer = async () => {
  // connect with db
  await connectDB();

  // sequelize autom. creates tables in psql if don't exist
  await sequelize.sync({ alter: true });
  console.log("[Order Service] Database models synchronized");

  try {
    await seedOrders();
  } catch (err) {
    console.error('[Order Service] Seeding failed (non-fatal):', err.message);
  }

  // DI
  const orderRepository = new OrderRepository();
  const cartRepository = new CartRepository();
  const variantRepository = new VariantRepository();
  const orderService = new OrderService(orderRepository, variantRepository);
  const cartService = new CartService(
    cartRepository,
    variantRepository,
    orderRepository,
  );
  const orderController = new OrderController(orderService);
  const cartController = new CartController(cartService);

  // Health Check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "Catalog Service is operational" });
  });

  // Order routes
  app.get("/api/v1/orders", orderController.getOrders);
  app.get("/api/v1/orders/:id", orderController.getOrderById);
  app.post("/api/v1/orders/:id/cancel", orderController.cancelOrder);
  app.post("/api/v1/orders", orderController.createOrder);

  // Cart routes
  app.post("/api/v1/cart/lines", cartController.addLine);
  app.get("/api/v1/cart", cartController.getCart);
  app.post("/api/v1/checkout", cartController.checkout);

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`[Order Service] Server is running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("[Order Service] Failed to initialize:", err);
  process.exit(1);
});

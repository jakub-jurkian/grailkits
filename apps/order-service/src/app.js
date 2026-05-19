require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize, connectDB } = require("./config/db");
const seedOrders = require("./db/seeds/seed_orders");
const OrderRepository = require("./repositories/order.repository");
const CartRepository = require("./repositories/cart.repository");
const VariantRepository = require("./repositories/variant.repository");
const PaymentRepository = require("./repositories/payment.repository");
const OrderService = require("./services/order.service");
const CartService = require("./services/cart.service");
const PaymentService = require("./services/payment.service");
const OrderController = require("./controllers/order.controller");
const CartController = require("./controllers/cart.controller");
const PaymentController = require("./controllers/payment.controller");

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
  await connectDB();

  // Sequelize manages carts, cart_lines, orders, order_items.
  // Prisma owns Payment, PaymentEvent and runs migrations via the Dockerfile
  // CMD (`prisma migrate deploy && npm start`) before this code executes.
  await sequelize.sync({ alter: true });
  console.log("[Order Service] Database models synchronized");

  try {
    await seedOrders();
  } catch (err) {
    console.error('[Order Service] Seeding failed (non-fatal):', err.message);
  }

  // DI - Sequelize-driven repos
  const orderRepository = new OrderRepository();
  const cartRepository = new CartRepository();
  const variantRepository = new VariantRepository();

  // DI - Prisma-driven repo (T4)
  const paymentRepository = new PaymentRepository();

  // Services
  const orderService = new OrderService(orderRepository, variantRepository);
  const cartService = new CartService(
    cartRepository,
    variantRepository,
    orderRepository,
  );
  
  const paymentService = new PaymentService(paymentRepository, orderRepository);

  // Controllers
  const orderController = new OrderController(orderService, cartService);
  const cartController = new CartController(cartService);
  const paymentController = new PaymentController(paymentService);

  // Order routes
  app.get("/api/v1/orders", orderController.getOrders);
  app.get("/api/v1/orders/:id", orderController.getOrderById);
  app.post("/api/v1/orders/:id/cancel", orderController.cancelOrder);
  app.post("/api/v1/orders/:id/payment", paymentController.create);
  app.post("/api/v1/orders", orderController.createOrder);

  // Cart routes
  app.post("/api/v1/cart/lines", cartController.addLine);
  app.get("/api/v1/cart", cartController.getCart);
  app.post("/api/v1/checkout", cartController.checkout);

  // Payment routes
  app.get("/api/v1/payments/count", paymentController.countByStatus);
  app.get("/api/v1/payments/:id", paymentController.getById);
  app.post("/api/v1/payments/:id/authorize", paymentController.authorize);
  app.post("/api/v1/payments/:id/fail", paymentController.markFailed);
};

startServer().catch((err) => {
  console.error("[Order Service] Failed to initialize:", err);
  process.exit(1);
});

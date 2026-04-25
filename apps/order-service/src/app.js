require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize, connectDB } = require("./config/db");
const OrderRepository = require("./repositories/order.repository");
const OrderService = require("./services/order.service");
const OrderController = require("./controllers/order.controller");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const startServer = async () => {
  // connect with db
  await connectDB();

  // sequelize autom. creates tables in psql if don't exist
  await sequelize.sync();
  console.log("[Order Service] Database models synchronized");

  // DI
  const orderRepository = new OrderRepository();
  const orderService = new OrderService(orderRepository);
  const orderController = new OrderController(orderService);

  app.post("/api/v1/orders", orderController.createOrder);

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`[Order Service] Server is running on port ${PORT}`);
  });
};

startServer();

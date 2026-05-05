const { sequelize } = require("../config/db");

const CANCELLABLE_STATUSES = ["PENDING", "PAID"];

class OrderService {
  constructor(orderRepository, variantRepository) {
    this.orderRepository = orderRepository;
    this.variantRepository = variantRepository;
  }

  async getOrdersByUser(userId) {
    if (!userId) {
      const err = new Error("Missing userId");
      err.statusCode = 400;
      throw err;
    }
    return await this.orderRepository.findByUserId(userId);
  }

  async getOrderById(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    return order;
  }

  async cancelOrder(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    if (order.userId !== userId) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      const err = new Error("Cannot cancel an order with status '" + order.status + "'");
      err.statusCode = 409;
      throw err;
    }
    return await sequelize.transaction(async (transaction) => {
      await this.orderRepository.cancelOrder(orderId, transaction);
      for (const item of order.items) {
        if (item.variantId) {
          await this.variantRepository.incrementStock(item.variantId, item.quantity, transaction);
        }
      }
      return await this.orderRepository.findById(orderId, transaction);
    });
  }

  async processCheckout(userId, cartItems) {
    const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const orderData = { userId, totalPrice, status: "PENDING" };
    return await this.orderRepository.createOrderWithItems(orderData, cartItems);
  }
}

module.exports = OrderService;

const { errorResponse } = require('../utils/errors');

class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
    this.createOrder = this.createOrder.bind(this);
    this.getOrders = this.getOrders.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
  }

  async getOrders(req, res) {
    try {
      const userId = req.header('x-user-id') || req.query.userId;
      const orders = await this.orderService.getOrdersByUser(userId);
      res.status(200).json(orders);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async getOrderById(req, res) {
    try {
      const userId = req.header('x-user-id') || req.query.userId;
      const order = await this.orderService.getOrderById(req.params.id, userId);
      res.status(200).json(order);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async cancelOrder(req, res) {
    try {
      const userId = req.header('x-user-id') || req.body.userId;
      const order = await this.orderService.cancelOrder(req.params.id, userId);
      res.status(200).json(order);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async createOrder(req, res) {
    try {
      const { userId, items } = req.body;
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        const err = Object.assign(new Error('Missing user ID or cart items are invalid/empty'), { statusCode: 400 });
        return errorResponse(res, err);
      }
      const order = await this.orderService.processCheckout(userId, items);
      res.status(201).json(order);
    } catch (error) {
      console.error('[OrderController] Checkout failed:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = OrderController;

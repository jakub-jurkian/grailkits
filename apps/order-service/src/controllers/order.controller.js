const { errorResponse } = require('../utils/errors');

class OrderController {
  constructor(orderService, cartService) {
    this.orderService = orderService;
    this.cartService = cartService;
    this.createOrder = this.createOrder.bind(this);
    this.getOrders = this.getOrders.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
  }

  async getOrders(req, res) {
    try {
      const userId = req.header('x-user-id');
      const orders = await this.orderService.getOrdersByUser(userId);
      res.status(200).json(orders);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async getOrderById(req, res) {
    try {
      const userId = req.header('x-user-id');
      const order = await this.orderService.getOrderById(req.params.id, userId);
      res.status(200).json(order);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async cancelOrder(req, res) {
    try {
      const userId = req.header('x-user-id');
      const order = await this.orderService.cancelOrder(req.params.id, userId);
      res.status(200).json(order);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async createOrder(req, res) {
    try {
      const userId = req.header('x-user-id');
      const { items } = req.body || {};
      if (!userId) {
        const err = Object.assign(new Error('Missing x-user-id header'), { statusCode: 400 });
        return errorResponse(res, err);
      }
      if (Array.isArray(items) && items.length > 0) {
        const err = Object.assign(new Error('Use /api/v1/checkout for cart-based orders'), { statusCode: 400 });
        return errorResponse(res, err);
      }
      const order = await this.cartService.checkout(userId);
      res.status(201).json(order);
    } catch (error) {
      console.error('[OrderController] Checkout failed:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = OrderController;

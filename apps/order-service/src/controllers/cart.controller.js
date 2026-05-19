const { errorResponse } = require('../utils/errors');

class CartController {
  constructor(cartService) {
    this.cartService = cartService;
    this.addLine = this.addLine.bind(this);
    this.getCart = this.getCart.bind(this);
    this.checkout = this.checkout.bind(this);
  }

  async addLine(req, res) {
    try {
      const userId = req.header('x-user-id');
      const { variantId, quantity } = req.body;
      const cart = await this.cartService.addLine(userId, variantId, quantity);
      res.status(200).json(cart);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.header('x-user-id');
      const cart = await this.cartService.getCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async checkout(req, res) {
    try {
      const userId = req.header('x-user-id');
      const order = await this.cartService.checkout(userId);
      res.status(201).json(order);
    } catch (error) {
      errorResponse(res, error);
    }
  }
}

module.exports = CartController;

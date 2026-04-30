class CartController {
  constructor(cartService) {
    this.cartService = cartService;

    this.addLine = this.addLine.bind(this);
    this.getCart = this.getCart.bind(this);
    this.checkout = this.checkout.bind(this);
  }

  async addLine(req, res) {
    try {
      const userId = req.header("x-user-id") || req.body.userId;
      const { variantId, quantity } = req.body;
      const cart = await this.cartService.addLine(userId, variantId, quantity);
      res.status(200).json(cart);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.header("x-user-id") || req.query.userId;
      const cart = await this.cartService.getCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  async checkout(req, res) {
    try {
      const userId = req.header("x-user-id") || req.body.userId;
      const order = await this.cartService.checkout(userId);
      res.status(201).json(order);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }
}

module.exports = CartController;

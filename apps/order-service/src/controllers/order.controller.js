class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
    this.createOrder = this.createOrder.bind(this);
  }

  async createOrder(req, res) {
    try {
      const { userId, items } = req.body;

      // Basic input validation
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ error: "Missing user ID or cart items are invalid/empty" });
      }

      // Process the checkout transaction
      const order = await this.orderService.processCheckout(userId, items);

      // Successful transaction
      res.status(201).json(order);
    } catch (error) {
      console.error("[OrderController] Checkout failed:", error);
      res.status(500).json({
        error: "Checkout process failed due to an internal server error",
      });
    }
  }
}

module.exports = OrderController;

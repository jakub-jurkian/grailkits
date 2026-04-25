class OrderService {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async processCheckout(userId, cartItems) {
    // Calculate the total order value
    // In a prod env, prices should be verified against the catalog-service
    // to prevent malicious tampering from the client side.
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Prepare the main order payload
    const orderData = {
      userId,
      totalPrice,
      status: "PENDING",
    };

    return await this.orderRepository.createOrderWithItems(
      orderData,
      cartItems,
    );
  }
}

module.exports = OrderService;

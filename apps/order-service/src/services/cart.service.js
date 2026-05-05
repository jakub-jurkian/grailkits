const { sequelize } = require("../config/db");

class CartService {
  constructor(cartRepository, variantRepository, orderRepository) {
    this.cartRepository = cartRepository;
    this.variantRepository = variantRepository;
    this.orderRepository = orderRepository;
  }

  async addLine(userId, variantId, quantity) {
    const qty = Number(quantity);
    if (!userId || !variantId || !Number.isInteger(qty) || qty <= 0) {
      const error = new Error("Invalid userId, variantId, or quantity");
      error.statusCode = 400;
      throw error;
    }

    return await sequelize.transaction(async (transaction) => {
      const variant = await this.variantRepository.getVariantById(
        variantId,
        transaction
      );

      if (!variant) {
        const error = new Error("Variant not found");
        error.statusCode = 404;
        throw error;
      }

      let cart = await this.cartRepository.findOpenCartByUser(userId);
      if (!cart) {
        cart = await this.cartRepository.createCart(userId, transaction);
      }

      const existingLine = await this.cartRepository.findLine(
        cart.id,
        variantId,
        transaction
      );

      const nextQuantity = existingLine
        ? existingLine.quantity + qty
        : qty;

      if (variant.stock < nextQuantity) {
        const error = new Error("Insufficient stock for requested quantity");
        error.statusCode = 409;
        throw error;
      }

      if (existingLine) {
        await this.cartRepository.updateLine(
          existingLine,
          nextQuantity,
          transaction
        );
      } else {
        await this.cartRepository.addLine(
          cart.id,
          {
            variantId,
            productId: variant.product_id,
            quantity: qty,
          },
          transaction
        );
      }

      return await this.cartRepository.getCartById(cart.id, transaction);
    });
  }

  async getCart(userId) {
    if (!userId) {
      const error = new Error("Missing userId");
      error.statusCode = 400;
      throw error;
    }

    const cart = await this.cartRepository.findOpenCartByUser(userId);
    if (!cart) {
      const error = new Error("Cart not found");
      error.statusCode = 404;
      throw error;
    }

    return cart;
  }

  async checkout(userId) {
    if (!userId) {
      const error = new Error("Missing userId");
      error.statusCode = 400;
      throw error;
    }

    const cart = await this.cartRepository.findOpenCartByUser(userId);
    if (!cart || !cart.lines || cart.lines.length === 0) {
      const error = new Error("Cart is empty or not found");
      error.statusCode = 400;
      throw error;
    }

    return await sequelize.transaction(async (transaction) => {
      const orderItems = [];
      let totalPrice = 0;

      for (const line of cart.lines) {
        const variant = await this.variantRepository.getVariantForUpdate(
          line.variantId,
          transaction
        );

        if (!variant) {
          const error = new Error("Variant not found during checkout");
          error.statusCode = 404;
          throw error;
        }

        if (variant.stock < line.quantity) {
          const error = new Error("Insufficient stock for checkout");
          error.statusCode = 409;
          throw error;
        }

        await this.variantRepository.decrementStock(
          line.variantId,
          line.quantity,
          transaction
        );

        totalPrice += Number(variant.price) * line.quantity;

        orderItems.push({
          productId: variant.product_id,
          variantId: variant.id,
          skuSnapshot: variant.sku,
          quantity: line.quantity,
          unitPrice: Number(variant.price),
        });
      }

      const orderData = {
        userId,
        totalPrice,
        status: "PENDING",
      };

      const order = await this.orderRepository.createOrderWithItemsTransaction(
        orderData,
        orderItems,
        transaction
      );

      await this.cartRepository.updateCartStatus(
        cart.id,
        "CHECKED_OUT",
        transaction
      );

      return order;
    });
  }
}

module.exports = CartService;

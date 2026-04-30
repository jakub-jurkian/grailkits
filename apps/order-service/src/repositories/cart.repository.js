const { Cart, CartLine } = require("../models");

class CartRepository {
  async findOpenCartByUser(userId) {
    return await Cart.findOne({
      where: { userId, status: "OPEN" },
      include: [{ model: CartLine, as: "lines" }],
    });
  }

  async createCart(userId, transaction) {
    return await Cart.create(
      { userId, status: "OPEN" },
      { transaction }
    );
  }

  async findLine(cartId, variantId, transaction) {
    return await CartLine.findOne({
      where: { cartId, variantId },
      transaction,
    });
  }

  async addLine(cartId, lineData, transaction) {
    return await CartLine.create(
      { ...lineData, cartId },
      { transaction }
    );
  }

  async updateLine(line, newQuantity, transaction) {
    return await line.update({ quantity: newQuantity }, { transaction });
  }

  async updateCartStatus(cartId, status, transaction) {
    return await Cart.update(
      { status },
      { where: { id: cartId }, transaction }
    );
  }

  async getCartById(cartId, transaction) {
    return await Cart.findByPk(cartId, {
      include: [{ model: CartLine, as: "lines" }],
      transaction,
    });
  }
}

module.exports = CartRepository;

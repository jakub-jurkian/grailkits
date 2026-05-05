const { Order, OrderItem } = require("../models");
const { sequelize } = require("../config/db");

const WITH_ITEMS = { include: [{ model: OrderItem, as: "items" }] };

class OrderRepository {
  async findByUserId(userId) {
    return await Order.findAll({
      where: { userId },
      ...WITH_ITEMS,
      order: [["createdAt", "DESC"]],
    });
  }

  async findById(orderId, transaction = null) {
    const opts = transaction ? { ...WITH_ITEMS, transaction } : { ...WITH_ITEMS };
    return await Order.findByPk(orderId, opts);
  }

  async createOrderWithItems(orderData, itemsData) {
    const transaction = await sequelize.transaction();
    try {
      const order = await this.createOrderWithItemsTransaction(orderData, itemsData, transaction);
      await transaction.commit();
      return order;
    } catch (error) {
      await transaction.rollback();
      console.error("[OrderRepository] Transaction failed, rolled back.", error);
      throw error;
    }
  }

  async createOrderWithItemsTransaction(orderData, itemsData, transaction) {
    const order = await Order.create(orderData, { transaction });
    const itemsToInsert = itemsData.map((item) => ({ ...item, orderId: order.id }));
    await OrderItem.bulkCreate(itemsToInsert, { transaction });
    return await Order.findByPk(order.id, { ...WITH_ITEMS, transaction });
  }

  async cancelOrder(orderId, transaction) {
    const [updatedRows] = await Order.update(
      { status: "CANCELLED" },
      { where: { id: orderId }, transaction }
    );
    return updatedRows > 0;
  }
}

module.exports = OrderRepository;

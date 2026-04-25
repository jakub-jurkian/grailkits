const { Order, OrderItem } = require("../models");
const { sequelize } = require("../config/db");

class OrderRepository {
  // Method to create an order and its items securely using a transaction
  async createOrderWithItems(orderData, itemsData) {

    // Start the transaction
    const transaction = await sequelize.transaction();

    try {
      // We pass the transaction object to ensure this operation is part of the vault
      const order = await Order.create(orderData, { transaction });

      // Prepare items by attaching the newly generated orderId to each
      const itemsToInsert = itemsData.map((item) => ({
        ...item,
        orderId: order.id,
      }));

      // bulkCreate is a method to insert an array of objects at once
      await OrderItem.bulkCreate(itemsToInsert, { transaction });

      // If we reach this point, no errors occurred. CLOSE AND LOCK THE VAULT (Save permanently).
      await transaction.commit();

      // Fetch and return the complete saved order including nested items
      return await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: "items",
          },
        ],
      });
    } catch (error) {
      // Something failed. The database will discard EVERYTHING in this transaction.
      await transaction.rollback();
      console.error(
        "[OrderRepository] Transaction failed, rolled back.",
        error,
      );
      throw error;
    }
  }
}

module.exports = OrderRepository;

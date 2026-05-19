const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'SHIPPED', 'CANCELLED'),
    defaultValue: 'PENDING'
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true,
  hooks: {
    // Domain hook: runs before Sequelize's own validation so our error message
    // and statusCode reach the caller cleanly.
    beforeValidate: (order) => {
      // Only apply when totalPrice is explicitly present (skips partial updates
      // such as status-only changes where totalPrice is undefined).
      if (order.totalPrice === undefined || order.totalPrice === null) return;

      // Coerce and validate integer grosze.
      const normalized = Number(order.totalPrice);
      if (!Number.isInteger(normalized)) {
        const err = new Error('Order total must be an integer (grosze)');
        err.statusCode = 400;
        throw err;
      }
      order.totalPrice = normalized;

      // Domain invariant: every order must have a positive total.
      if (order.totalPrice <= 0) {
        const err = new Error('Order total must be greater than zero');
        err.statusCode = 400;
        throw err;
      }
    }
  }
});

module.exports = Order;
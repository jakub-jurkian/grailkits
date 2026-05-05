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
    type: DataTypes.DECIMAL(10, 2),
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
    // 1. Normalise totalPrice to 2 decimal places.
    // 2. Enforce the invariant: every order must have a positive total.
    beforeValidate: (order) => {
      // Only apply when totalPrice is explicitly present (skips partial updates
      // such as status-only changes where totalPrice is undefined).
      if (order.totalPrice === undefined || order.totalPrice === null) return;

      // 1. Normalise to 2 decimal places.
      order.totalPrice = Number(Number(order.totalPrice).toFixed(2));

      // 2. Domain invariant: every order must have a positive total.
      if (order.totalPrice <= 0) {
        const err = new Error('Order total must be greater than zero');
        err.statusCode = 400;
        throw err;
      }
    }
  }
});

module.exports = Order;
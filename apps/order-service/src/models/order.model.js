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
    allowNull: false,
    validate: {
      min: 0
    }
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
    // Domain hook: normalise precision then enforce the business invariant that
    // every order must have a positive total. Sequelize aborts the INSERT and
    // propagates the error to the caller if the guard fails.
    beforeCreate: (order) => {
      if (order.totalPrice !== undefined && order.totalPrice !== null) {
        order.totalPrice = Number(Number(order.totalPrice).toFixed(2));
      }
      if (!order.totalPrice || order.totalPrice <= 0) {
        const err = new Error('Order total must be greater than zero');
        err.statusCode = 400;
        throw err;
      }
    }
  }
});

module.exports = Order;
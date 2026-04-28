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
    beforeCreate: (order) => {
      if (order.totalPrice !== undefined && order.totalPrice !== null) {
        order.totalPrice = Number(Number(order.totalPrice).toFixed(2));
      }
    }
  }
});

module.exports = Order;
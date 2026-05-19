const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class OrderItem extends Model {}

OrderItem.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  variantId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skuSnapshot: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  unitPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 }
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  tableName: 'order_items',
  timestamps: false
});

module.exports = OrderItem;

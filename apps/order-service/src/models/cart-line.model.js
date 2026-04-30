const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class CartLine extends Model {}

CartLine.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cartId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  variantId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  sequelize,
  modelName: 'CartLine',
  tableName: 'cart_lines',
  timestamps: true
});

module.exports = CartLine;

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Cart extends Model {}

Cart.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CHECKED_OUT', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'OPEN'
  }
}, {
  sequelize,
  modelName: 'Cart',
  tableName: 'carts',
  timestamps: true
});

module.exports = Cart;
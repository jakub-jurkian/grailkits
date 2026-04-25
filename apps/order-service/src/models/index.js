const Order = require('./order.model');
const OrderItem = require('./order-item.model');

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

module.exports = { Order, OrderItem };
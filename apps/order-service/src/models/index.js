const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const Cart = require('./cart.model');
const CartLine = require('./cart-line.model');

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

Cart.hasMany(CartLine, {
  foreignKey: 'cartId',
  as: 'lines'
});

CartLine.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart'
});

module.exports = { Order, OrderItem, Cart, CartLine };
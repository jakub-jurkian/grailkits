// Must mirror setup.js — set DATABASE_URL before any model import
process.env.DATABASE_URL = 'postgres://root:rootpassword@localhost:5432/grailkits_test';
process.env.NODE_ENV = 'test';

const express = require('express');
const CartRepository = require('../repositories/cart.repository');
const OrderRepository = require('../repositories/order.repository');
const CartService = require('../services/cart.service');
const OrderService = require('../services/order.service');
const CartController = require('../controllers/cart.controller');
const OrderController = require('../controllers/order.controller');

/**
 * Build an in-memory VariantRepository that never touches the DB.
 * `variantMap` is a plain object keyed by variantId — e.g.:
 *   { 'v-001': { id: 'v-001', product_id: 'p-001', price: 10000, stock: 10, sku: 'SKU-001' } }
 *
 * The map is deep-cloned so mutations inside one test don't bleed into others.
 */
function createMockVariantRepo(variantMap = {}) {
  // Deep clone so stock decrements are local to this instance
  const store = JSON.parse(JSON.stringify(variantMap));

  return {
    async getVariantById(variantId) {
      return store[variantId] || null;
    },
    async getVariantForUpdate(variantId) {
      return store[variantId] || null;
    },
    async decrementStock(variantId, quantity) {
      if (store[variantId]) {
        store[variantId].stock -= quantity;
      }
    },
    async incrementStock(variantId, quantity) {
      if (store[variantId]) {
        store[variantId].stock += quantity;
      }
    },
  };
}

/**
 * Creates an Express app for testing.
 *
 * @param {object} variantMap  - Variant fixtures for the mock VariantRepository.
 * @param {object} [overrideVariantRepo] - Optional fully custom VariantRepository object
 *                                         (used for oversell simulation tests).
 */
function createTestApp(variantMap = {}, overrideVariantRepo = null) {
  const app = express();
  app.use(express.json());

  const cartRepo = new CartRepository();
  const orderRepo = new OrderRepository();
  const variantRepo = overrideVariantRepo || createMockVariantRepo(variantMap);

  const orderService = new OrderService(orderRepo, variantRepo);
  const cartService = new CartService(cartRepo, variantRepo, orderRepo);

  const orderController = new OrderController(orderService, cartService);
  const cartController = new CartController(cartService);

  // Order routes
  app.post('/api/v1/orders', orderController.createOrder);
  app.get('/api/v1/orders', orderController.getOrders);
  app.get('/api/v1/orders/:id', orderController.getOrderById);
  app.post('/api/v1/orders/:id/cancel', orderController.cancelOrder);

  // Cart routes
  app.post('/api/v1/cart/lines', cartController.addLine);
  app.get('/api/v1/cart', cartController.getCart);
  app.post('/api/v1/checkout', cartController.checkout);

  return app;
}

module.exports = { createTestApp, createMockVariantRepo };

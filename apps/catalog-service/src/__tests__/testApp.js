// Builds the Express app for tests without listen(), real Mongo, or side-effecting app.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const CategoryRepository = require('../repositories/category.repository');
const ProductRepository = require('../repositories/product.repository');
const ProductDetailsRepository = require('../repositories/product-details.repository');
const ProductService = require('../services/product.service');
const ProductController = require('../controllers/product.controller');

// Stub for MongoDB ProductDetailRepository — service handles null non-fatally
const mongoRepoStub = {
  create: async () => null,
  findByProductId: async () => null,
  findManyByProductIds: async () => [],
  updateByProductId: async () => false,
  deleteByProductId: async () => false,
};

function createTestApp(pool) {
  const app = express();
  app.use(express.json());

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  const categoryRepo = new CategoryRepository(pool);
  const productRepo = new ProductRepository(pool);
  const productDetailsRepo = new ProductDetailsRepository(prisma);
  const productService = new ProductService(productRepo, productDetailsRepo, mongoRepoStub);
  const productController = new ProductController(productService);

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.get('/api/v1/categories', async (req, res) => {
    try {
      const categories = await categoryRepo.findAll();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/products', productController.getProducts);
  app.get('/api/v1/products/count', productController.getProductCount);
  app.get('/api/v1/products/:id', productController.getProductDetails);
  app.post('/api/v1/products', productController.createProduct);

  return app;
}

module.exports = createTestApp;

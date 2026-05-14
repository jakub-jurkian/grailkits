// Builds the Express app for tests without listen(), real Mongo, or side-effecting app.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const CategoryRepository = require('../repositories/category.repository');
const ProductRepository = require('../repositories/product.repository');
const ProductDetailsRepository = require('../repositories/product-details.repository');
const ProductService = require('../services/product.service');
const ProductController = require('../controllers/product.controller');

// Default stub for MongoDB ProductDetailRepository - service handles null non-fatally
const DEFAULT_MONGO_STUB = {
  create: async () => null,
  findByProductId: async () => null,
  findManyByProductIds: async () => [],
  searchByText: async () => [],
  updateByProductId: async () => true,
  deleteByProductId: async () => false,
};

// Tests can pass `mongoRepoOverride` to swap individual methods (e.g. to
// simulate "document not found" for the PATCH /details 404 path).
function createTestApp(pool, mongoRepoOverride = {}) {
  const app = express();
  app.use(express.json());

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  const mongoRepo = { ...DEFAULT_MONGO_STUB, ...mongoRepoOverride };

  const categoryRepo = new CategoryRepository(pool);
  const productRepo = new ProductRepository(pool);
  const productDetailsRepo = new ProductDetailsRepository(prisma);
  const productService = new ProductService(productRepo, productDetailsRepo, mongoRepo);
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

  // Same order as production app.js: /search and /count before /:id catch-all.
  app.get('/api/v1/products/search', productController.searchProducts);
  app.get('/api/v1/products/count', productController.getProductCount);
  app.get('/api/v1/products', productController.getProducts);
  app.get('/api/v1/products/:id', productController.getProductDetails);
  app.patch('/api/v1/products/:id/details', productController.updateProductDetails);
  app.post('/api/v1/products', productController.createProduct);

  return app;
}

module.exports = createTestApp;

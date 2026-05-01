const express = require("express");
const knex = require("knex")(
  require("../knexfile")[process.env.NODE_ENV || "development"]
);
const pool = require("./config/db");
const prisma = require('./config/prisma');

const CategoryRepository = require("./repositories/category.repository");
const ProductRepository = require('./repositories/product.repository');
const ProductDetailsRepository = require('./repositories/product-details.repository');
const ProductDetailRepository = require('./repositories/product-detail.repository');
const ProductService = require('./services/product.service');
const ProductController = require('./controllers/product.controller');
const { connectMongo } = require("./config/mongo");
const seedProductDetails = require('./db/seed_product_details');

const app = express();
app.use(express.json());

// Health endpoint registered first so it responds immediately during startup
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Catalog Service is operational' });
});

// Start listening before async init so the health check passes right away
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Catalog Service] Server is running on port ${PORT}`);
});

const startServer = async () => {
  // Run Knex migrations so tables exist before any request hits them
  await knex.migrate.latest();
  console.log('[Catalog Service] Migrations applied');

  // Seed initial data (idempotent — seeds clear and re-insert)
  await knex.seed.run();
  console.log('[Catalog Service] Seeds applied');

  await connectMongo();

  try {
    await seedProductDetails();
  } catch (err) {
    console.error('[Catalog Service] MongoDB seeding failed (non-fatal):', err.message);
  }

  // DI (Composition Root)
  const categoryRepo = new CategoryRepository(pool);
  const productRepo = new ProductRepository(pool);
  const productDetailsRepo = new ProductDetailsRepository(prisma);
  const productDetailMongoRepo = new ProductDetailRepository();
  const productService = new ProductService(productRepo, productDetailsRepo, productDetailMongoRepo);
  const productController = new ProductController(productService);

  // Categories Route
  app.get('/api/v1/categories', async (req, res) => {
    try {
      const categories = await categoryRepo.findAll();
      res.json(categories);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Products Routes
  app.get('/api/v1/products', productController.getProducts);
  app.get('/api/v1/products/count', productController.getProductCount);
  app.get('/api/v1/products/:id', productController.getProductDetails);
  app.post('/api/v1/products', productController.createProduct);
};

startServer().catch((err) => {
  console.error('[Catalog Service] Failed to initialize:', err);
  process.exit(1);
});
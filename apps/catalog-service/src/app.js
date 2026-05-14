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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Catalog Service is operational' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Catalog Service] Server is running on port ${PORT}`);
});

const startServer = async () => {
  await knex.migrate.latest();
  console.log('[Catalog Service] Migrations applied');

  await knex.seed.run();
  console.log('[Catalog Service] Seeds applied');

  await connectMongo();

  try {
    await seedProductDetails();
  } catch (err) {
    console.error('[Catalog Service] MongoDB seeding failed (non-fatal):', err.message);
  }

  const categoryRepo = new CategoryRepository(pool);
  const productRepo = new ProductRepository(pool);
  const productDetailsRepo = new ProductDetailsRepository(prisma);
  const productDetailMongoRepo = new ProductDetailRepository();
  const productService = new ProductService(productRepo, productDetailsRepo, productDetailMongoRepo);
  const productController = new ProductController(productService);

  app.get('/api/v1/products/categories', async (req, res) => {
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
  // NOTE on ordering: more-specific paths (/search, /count) must be registered
  // BEFORE the catch-all /:id, otherwise Express would match "search" or "count"
  // as the :id parameter and route them to getProductDetails.
  app.get('/api/v1/products/search', productController.searchProducts);
  app.get('/api/v1/products/count', productController.getProductCount);
  app.get('/api/v1/products', productController.getProducts);
  app.get('/api/v1/products/:id', productController.getProductDetails);
  app.patch('/api/v1/products/:id/details', productController.updateProductDetails);
  app.post('/api/v1/products', productController.createProduct);
};

startServer().catch((err) => {
  console.error('[Catalog Service] Failed to initialize:', err);
  process.exit(1);
});

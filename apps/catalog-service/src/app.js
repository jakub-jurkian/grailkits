const express = require("express");
const knex = require('./config/knex');
const pool = require("./config/db");

const CategoryRepository = require("./repositories/category.repository");
const ProductRepository = require('./repositories/product.repository');
const ProductRelationalRepository = require('./repositories/product-relational.repository');
const ProductDetailMongoRepository = require('./repositories/product-detail-mongo.repository');
const CategoryService = require('./services/category.service');
const ProductService = require('./services/product.service');
const CategoryController = require('./controllers/category.controller');
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
  const productRelationalRepo = new ProductRelationalRepository(pool);
  const productDetailMongoRepo = new ProductDetailMongoRepository();
  const categoryService = new CategoryService(categoryRepo);
  const productService = new ProductService(productRepo, productRelationalRepo, productDetailMongoRepo);
  const categoryController = new CategoryController(categoryService);
  const productController = new ProductController(productService);

  app.get('/api/v1/products/categories', categoryController.getCategories);

  // Products Routes
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

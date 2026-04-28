const express = require("express");
const pool = require("./config/db");
const prisma = require('./config/prisma');

const CategoryRepository = require("./repositories/category.repository");
const ProductRepository = require('./repositories/product.repository');
const ProductDetailsRepository = require('./repositories/product-details.repository');
const ProductService = require('./services/product.service');
const ProductController = require('./controllers/product.controller');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Catalog Service is operational' });
});


// DI (Composition Root)

// Categories (Old PoC way)
const categoryRepo = new CategoryRepository(pool);

// Products (Proper 3-Tier Architecture)
const productRepo = new ProductRepository(pool);
const productDetailsRepo = new ProductDetailsRepository(prisma);
const productService = new ProductService(productRepo, productDetailsRepo);
const productController = new ProductController(productService);


// Routes

// Categories Route (To be refactored later)
app.get('/api/v1/categories', async (req, res) => {
  try {
    const categories = await categoryRepo.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Products Route
app.get('/api/v1/products', productController.getProducts);
app.get('/api/v1/products/:id', productController.getProductDetails);
app.post('/api/v1/products', productController.createProduct);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Catalog Service is operational" });
});

// start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Catalog Service running on port ${PORT}`);
});
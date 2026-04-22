const express = require("express");
const pool = require("./config/db");

const CategoryRepository = require("./repositories/category.repository");
const ProductRepository = require('./repositories/product.repository');
const ProductService = require('./services/product.service');
const ProductController = require('./controllers/product.controller');

const app = express();
app.use(express.json());


// DI (Composition Root)

// Categories (Old PoC way)
const categoryRepo = new CategoryRepository(pool);

// Products (Proper 3-Tier Architecture)
const productRepo = new ProductRepository(pool);
const productService = new ProductService(productRepo);
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


// start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Catalog Service running on port ${PORT}`);
});
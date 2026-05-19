const { errorResponse } = require('../utils/errors');

class ProductController {
  constructor(productService) {
    this.productService = productService;
    this.getProducts = this.getProducts.bind(this);
    this.getProductDetails = this.getProductDetails.bind(this);
    this.getProductCount = this.getProductCount.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.searchProducts = this.searchProducts.bind(this);
    this.updateProductDetails = this.updateProductDetails.bind(this);
  }

  async getProducts(req, res) {
    try {
      const { categoryId, minPrice, maxPrice, available } = req.query;
      const parsedMinPrice = minPrice ? parseFloat(minPrice) : null;
      const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : null;
      const inStock = available ? available === 'true' : true;
      const products = await this.productService.getAllProducts(
        categoryId || null, parsedMinPrice, parsedMaxPrice, inStock
      );
      res.status(200).json(products);
    } catch (error) {
      console.error('[ProductController] Error fetching products:', error);
      errorResponse(res, error);
    }
  }

  async getProductDetails(req, res) {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);
      res.status(200).json(product);
    } catch (error) {
      console.error('[ProductController] Error fetching product details:', error);
      errorResponse(res, error);
    }
  }

  async getProductCount(req, res) {
    try {
      const total = await this.productService.getProductCount();
      res.status(200).json({ total });
    } catch (error) {
      console.error('[ProductController] Error counting products:', error);
      errorResponse(res, error);
    }
  }

  async createProduct(req, res) {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('[ProductController] Error creating product:', error);
      errorResponse(res, error);
    }
  }

  // GET /api/v1/products/search?q=<term> - full-text search via $text/$search
  async searchProducts(req, res) {
    try {
      const results = await this.productService.searchProductsByText(req.query.q);
      res.status(200).json(results);
    } catch (error) {
      console.error('[ProductController] Error searching products:', error);
      errorResponse(res, error);
    }
  }

  // PATCH /api/v1/products/:id/details - partial update via $set with whitelist
  async updateProductDetails(req, res) {
    try {
      const updated = await this.productService.updateProductDetails(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      console.error('[ProductController] Error updating product details:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = ProductController;

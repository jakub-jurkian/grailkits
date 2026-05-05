const { errorResponse } = require('../utils/errors');

class ProductController {
  constructor(productService) {
    this.productService = productService;
    this.getProducts = this.getProducts.bind(this);
    this.getProductDetails = this.getProductDetails.bind(this);
    this.getProductCount = this.getProductCount.bind(this);
    this.createProduct = this.createProduct.bind(this);
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
      if (error.message === 'PRODUCT_NOT_FOUND') {
        const notFound = Object.assign(new Error('Product not found'), { statusCode: 404 });
        return errorResponse(res, notFound);
      }
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
}

module.exports = ProductController;

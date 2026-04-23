class ProductController {
  constructor(productService) {
    this.productService = productService;

    // Bind the context of 'this' because Express router loses it
    this.getProducts = this.getProducts.bind(this);
    this.getProductDetails = this.getProductDetails.bind(this);
    this.createProduct = this.createProduct.bind(this);
  }

  async getProducts(req, res) {
    try {
      const { categoryId } = req.query;
      const products = await this.productService.getAllProducts(categoryId);
      res.status(200).json(products);
    } catch (error) {
      console.error("[ProductController] Error fetching products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getProductDetails(req, res) {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);
      res.status(200).json(product);
    } catch (error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createProduct(req, res) {
    try {
      // req.body includes JSON data sent by user via POST
      const product = await this.productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("[ProductController] Error creating product:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = ProductController;

class ProductController {
  constructor(productService) {
    this.productService = productService;

    // Bind the context of 'this' because Express router loses it
    this.getProducts = this.getProducts.bind(this);
  }

  async getProducts(req, res) {
    try {
      const products = await this.productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      console.error("[ProductController] Error fetching products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = ProductController;

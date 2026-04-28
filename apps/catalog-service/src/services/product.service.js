class ProductService {
  constructor(productRepository, productDetailsRepository) {
    this.productRepository = productRepository;
    this.productDetailsRepository = productDetailsRepository;
  }

  async getAllProducts(categoryId) {
    return await this.productRepository.findAllWithVariants(categoryId);
  }

  async getProductById(id) {
    const product = await this.productDetailsRepository.findById(id);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    return product;
  }

  async getProductCount() {
    return await this.productDetailsRepository.countProducts();
  }

  async createProduct(data) {
    return await this.productDetailsRepository.create(data);
  }
}

module.exports = ProductService;

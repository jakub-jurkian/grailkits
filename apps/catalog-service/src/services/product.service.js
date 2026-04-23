class ProductService {
  constructor(productRepository, productDetailsRepository) {
    this.productRepository = productRepository;
    this.productDetailsRepository = productDetailsRepository;
  }

  async getAllProducts() {
    return await this.productRepository.findAllWithVariants();
  }

  async getProductById(id) {
    const product = await this.productDetailsRepository.findById(id);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    return product;
  }
}

module.exports = ProductService;

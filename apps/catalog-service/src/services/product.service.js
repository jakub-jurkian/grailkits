class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async getAllProducts() {
    return await this.productRepository.findAllWithVariants();
  }
}

module.exports = ProductService;

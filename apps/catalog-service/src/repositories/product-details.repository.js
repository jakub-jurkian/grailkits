class ProductDetailsRepository {
  constructor(prismaClient) {
    this.prismaClient = prismaClient;
  }

  async findById(productId) {
    return await this.prismaClient.products.findUnique({
      where: {
        id: productId,
      },
      include: {
        categories: true,
        variants: true,
      },
    });
  }
}

module.exports = ProductDetailsRepository;

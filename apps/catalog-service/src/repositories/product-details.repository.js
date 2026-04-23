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

  async create(productData) {
    // Prisma automatically returns newly created obj
    return await this.prismaClient.products.create({
      data: productData
    });
  }
}

module.exports = ProductDetailsRepository;

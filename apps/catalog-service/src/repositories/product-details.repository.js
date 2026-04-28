class ProductDetailsRepository {
  constructor(prismaClient) {
    this.prismaClient = prismaClient;
  }

  async countProducts() {
    const result = await this.prismaClient.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM products
    `;

    return Number(result?.[0]?.total ?? 0);
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

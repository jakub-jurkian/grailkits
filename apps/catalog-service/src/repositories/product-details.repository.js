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
    const { categoryId, ...rest } = productData;
    return await this.prismaClient.products.create({
      data: {
        ...rest,
        categories: {
          connect: { id: categoryId },
        },
      },
    });
  }

  // Used for compensation rollback when the subsequent Mongo write fails
  async deleteById(productId) {
    await this.prismaClient.products.delete({
      where: { id: productId },
    });
  }
}

module.exports = ProductDetailsRepository;

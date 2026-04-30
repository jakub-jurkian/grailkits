class ProductService {
  constructor(productRepository, productDetailsRepository, productDetailMongoRepository) {
    this.productRepository = productRepository;
    this.productDetailsRepository = productDetailsRepository;       // Prisma — PG reads
    this.productDetailMongoRepository = productDetailMongoRepository; // native driver — Mongo
  }

  async getAllProducts(categoryId, minPrice = null, maxPrice = null, inStock = true) {
    return await this.productRepository.findAllWithVariants(categoryId, minPrice, maxPrice, inStock);
  }

  async getProductById(id) {
    // Fetch relational data from PG via Prisma
    const product = await this.productDetailsRepository.findById(id);

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    // Enrich with document data from MongoDB (non-fatal if missing)
    try {
      const details = await this.productDetailMongoRepository.findByProductId(id);
      if (details) {
        product.longDescription = details.longDescription;
        product.specs = details.specs;
        product.gallery = details.gallery;
      }
    } catch (err) {
      console.warn('[ProductService] Could not fetch Mongo details for product', id, err.message);
    }

    return product;
  }

  async getProductCount() {
    return await this.productDetailsRepository.countProducts();
  }

  // Krok 4 + 5: accepts PG fields + Mongo fields, writes to both with compensation
  async createProduct(data) {
    const { longDescription, specs, gallery, ...pgData } = data;

    // Step 1 — write to PostgreSQL
    const created = await this.productDetailsRepository.create(pgData);
    const productId = created.id;

    // Step 2 — write to MongoDB (Hybryda T8c)
    try {
      await this.productDetailMongoRepository.create(productId, {
        longDescription,
        specs,
        gallery,
      });
    } catch (mongoErr) {
      // Compensation: remove the PG record so the two stores stay consistent
      console.error('[ProductService] Mongo write failed, compensating PG insert:', mongoErr.message);
      try {
        await this.productDetailsRepository.deleteById(productId);
      } catch (pgErr) {
        console.error('[ProductService] Compensation also failed — manual cleanup needed for id:', productId, pgErr.message);
      }

      const err = new Error('Product creation failed: could not persist document details');
      err.statusCode = 503;
      err.code = 'MONGO_WRITE_FAILED';
      err.details = mongoErr.message;
      throw err;
    }

    return { ...created, longDescription, specs, gallery };
  }
}

module.exports = ProductService;

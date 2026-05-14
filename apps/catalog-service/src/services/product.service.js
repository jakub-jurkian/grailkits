// Whitelist of fields that PATCH /products/:id/details is allowed to write to
// the MongoDB product_details collection. Anything else (including Mongo
// query operators) is silently dropped before reaching the native driver.
const ALLOWED_DETAIL_FIELDS = ['longDescription', 'specs', 'gallery'];

class ProductService {
  constructor(productRepository, productDetailsRepository, productDetailMongoRepository) {
    this.productRepository = productRepository;
    this.productDetailsRepository = productDetailsRepository;
    this.productDetailMongoRepository = productDetailMongoRepository;
  }

  async getAllProducts(categoryId, minPrice = null, maxPrice = null, inStock = true) {
    return await this.productRepository.findAllWithVariants(categoryId, minPrice, maxPrice, inStock);
  }

  async getProductById(id) {
    const product = await this.productDetailsRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
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

  async createProduct(data) {
    const { longDescription, specs, gallery, ...pgData } = data;
    const created = await this.productDetailsRepository.create(pgData);
    const productId = created.id;
    try {
      await this.productDetailMongoRepository.create(productId, { longDescription, specs, gallery });
    } catch (mongoErr) {
      console.error('[ProductService] Mongo write failed, compensating PG insert:', mongoErr.message);
      try {
        await this.productDetailsRepository.deleteById(productId);
      } catch (pgErr) {
        console.error('[ProductService] Compensation also failed - manual cleanup needed for id:', productId, pgErr.message);
      }
      const err = new Error('Product creation failed: could not persist document details');
      err.statusCode = 503;
      err.code = 'MONGO_WRITE_FAILED';
      err.details = mongoErr.message;
      throw err;
    }
    return { ...created, longDescription, specs, gallery };
  }

  // T5: full-text search ($text + $search). Domain guard: q min 2 chars.
  async searchProductsByText(q) {
    if (typeof q !== 'string' || q.trim().length < 2) {
      const err = new Error('Query parameter "q" is required (min 2 characters)');
      err.statusCode = 400;
      throw err;
    }
    return await this.productDetailMongoRepository.searchByText(q.trim());
  }

  // T5: PATCH product_details ($set) with strict whitelist + type checks.
  async updateProductDetails(productId, body) {
    if (!productId) {
      const err = new Error('productId is required');
      err.statusCode = 400;
      throw err;
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      const err = new Error('Request body must be a JSON object');
      err.statusCode = 400;
      throw err;
    }
    const patch = {};
    for (const k of ALLOWED_DETAIL_FIELDS) {
      if (k in body) patch[k] = body[k];
    }
    if (Object.keys(patch).length === 0) {
      const err = new Error('Body must contain at least one of: ' + ALLOWED_DETAIL_FIELDS.join(', '));
      err.statusCode = 400;
      throw err;
    }
    if ('longDescription' in patch && typeof patch.longDescription !== 'string') {
      const err = new Error('longDescription must be a string');
      err.statusCode = 400;
      throw err;
    }
    if ('specs' in patch && (typeof patch.specs !== 'object' || patch.specs === null || Array.isArray(patch.specs))) {
      const err = new Error('specs must be a plain object');
      err.statusCode = 400;
      throw err;
    }
    if ('gallery' in patch && !Array.isArray(patch.gallery)) {
      const err = new Error('gallery must be an array of URL strings');
      err.statusCode = 400;
      throw err;
    }
    const modified = await this.productDetailMongoRepository.updateByProductId(productId, patch);
    if (!modified) {
      const err = new Error('Product details not found for productId: ' + productId);
      err.statusCode = 404;
      throw err;
    }
    return { productId, updated: patch };
  }
}

module.exports = ProductService;

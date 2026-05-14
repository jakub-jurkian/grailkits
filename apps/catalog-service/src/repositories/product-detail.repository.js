const { getDb } = require('../config/mongo');

const COLLECTION = 'product_details';

class ProductDetailRepository {
  _col() {
    return getDb().collection(COLLECTION);
  }

  // Insert a new product detail document
  async create(productId, details) {
    const doc = {
      productId,
      longDescription: details.longDescription || '',
      specs: details.specs || {},
      gallery: details.gallery || [],
      createdAt: new Date(),
    };
    const result = await this._col().insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  // Fetch one document by productId ($eq operator)
  async findByProductId(productId) {
    return await this._col().findOne({ productId: { $eq: productId } });
  }

  // Fetch details for multiple products at once ($in operator)
  async findManyByProductIds(productIds) {
    return await this._col()
      .find({ productId: { $in: productIds } })
      .toArray();
  }

  // Full-text search across longDescription ($text + $search).
  // Results scored with $meta:'textScore' and capped at `limit` (default 20).
  async searchByText(searchTerm, limit = 20) {
    return await this._col()
      .find({ $text: { $search: searchTerm } })
      .project({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray();
  }

  // Patch details in place ($set operator)
  async updateByProductId(productId, patch) {
    const result = await this._col().updateOne(
      { productId: { $eq: productId } },
      { $set: { ...patch, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // Remove document - used for compensation when PG write is rolled back
  async deleteByProductId(productId) {
    const result = await this._col().deleteOne({ productId: { $eq: productId } });
    return result.deletedCount > 0;
  }
}

module.exports = ProductDetailRepository;

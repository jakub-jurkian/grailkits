const { getCatalogPool } = require('../config/pg');
const { queryWithPgErrorMapping } = require('../utils/pg');

// Writes denormalised review statistics to the products table in PostgreSQL.
// Called by ReviewService after a review is approved in MongoDB.
class ProductStatsRepository {
  async updateReviewStats(productId, { avgRating, reviewCount }) {
    const pool = getCatalogPool();
    await queryWithPgErrorMapping(
      pool,
      `UPDATE products
          SET avg_rating   = $1,
              review_count = $2,
              updated_at   = now()
        WHERE id = $3`,
      [avgRating, reviewCount, productId]
    );
  }
}

module.exports = ProductStatsRepository;

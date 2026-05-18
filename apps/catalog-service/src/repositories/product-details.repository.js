const { queryWithPgErrorMapping } = require('../utils/pg');

// pg-based replacement for what used to be a Prisma-backed repository.
// The shape returned by findById / create is intentionally kept compatible
// with Prisma's findUnique({ include: { categories, variants } }) and
// create({ data, categories: { connect: ... } }) so the rest of the service
// layer and the public API contract do not change.
class ProductDetailsRepository {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  // Returns { id, category_id, name, brand, description, review_count,
  //           avg_rating, created_at, updated_at,
  //           categories: { id, name, created_at, updated_at } | null,
  //           variants: [...] }
  // or null when no product matches.
  async findById(productId) {
    const sql = `
      SELECT
        p.id, p.category_id, p.name, p.brand, p.description,
        p.review_count, p.avg_rating, p.created_at, p.updated_at,
        c.id   AS cat_id,
        c.name AS cat_name,
        c.created_at AS cat_created_at,
        c.updated_at AS cat_updated_at,
        v.id   AS variant_id,
        v.product_id AS variant_product_id,
        v.size AS variant_size,
        v.price AS variant_price,
        v.stock AS variant_stock,
        v.sku   AS variant_sku,
        v.created_at AS variant_created_at,
        v.updated_at AS variant_updated_at
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN variants   v ON v.product_id = p.id
      WHERE p.id = $1
    `;
    const { rows } = await queryWithPgErrorMapping(this.dbPool, sql, [productId]);
    if (rows.length === 0) return null;

    const first = rows[0];
    const product = {
      id: first.id,
      category_id: first.category_id,
      name: first.name,
      brand: first.brand,
      description: first.description,
      review_count: first.review_count,
      avg_rating: first.avg_rating,
      created_at: first.created_at,
      updated_at: first.updated_at,
      categories: first.cat_id
        ? {
            id: first.cat_id,
            name: first.cat_name,
            created_at: first.cat_created_at,
            updated_at: first.cat_updated_at,
          }
        : null,
      variants: [],
    };

    for (const row of rows) {
      if (row.variant_id) {
        product.variants.push({
          id: row.variant_id,
          product_id: row.variant_product_id,
          size: row.variant_size,
          price: row.variant_price,
          stock: row.variant_stock,
          sku: row.variant_sku,
          created_at: row.variant_created_at,
          updated_at: row.variant_updated_at,
        });
      }
    }

    return product;
  }

  // Inserts a row into products and returns the full row (same shape callers
  // expected from Prisma's create()).
  // Accepts { name, brand, description, categoryId } — categoryId is mapped to
  // the category_id column so the service layer keeps its current contract.
  async create(productData) {
    const { name, brand, description = null, categoryId } = productData;

    const sql = `
      INSERT INTO products (name, brand, description, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category_id, name, brand, description,
                review_count, avg_rating, created_at, updated_at
    `;
    const { rows } = await queryWithPgErrorMapping(
      this.dbPool,
      sql,
      [name, brand, description, categoryId]
    );
    return rows[0];
  }

  // Used by ProductService.createProduct for compensation when the Mongo
  // write fails. variants/product_details cascade via FK ON DELETE CASCADE
  // for variants; product_details in Mongo is the service's job.
  async deleteById(productId) {
    const sql = `DELETE FROM products WHERE id = $1`;
    await queryWithPgErrorMapping(this.dbPool, sql, [productId]);
  }

  async countProducts() {
    const sql = `SELECT COUNT(*)::int AS total FROM products`;
    const { rows } = await queryWithPgErrorMapping(this.dbPool, sql);
    return Number(rows[0]?.total ?? 0);
  }
}

module.exports = ProductDetailsRepository;

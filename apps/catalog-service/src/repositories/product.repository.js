const { queryWithPgErrorMapping } = require("../utils/pg");
const knex = require("knex")(
  require("../../knexfile")[process.env.NODE_ENV || "development"],
);

class ProductRepository {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async findAllWithVariants(
    categoryId = null,
    minPrice = null,
    maxPrice = null,
    inStock = true,
  ) {
    // Build Knex query with explicit column selection and aliasing
    let query = knex("products")
      .select(
        "products.id as product_id",
        "products.name",
        "products.brand",
        "products.description",
        "variants.id as variant_id",
        "variants.size",
        "variants.price",
        "variants.stock",
        "variants.sku",
      )
      .leftJoin("variants", "products.id", "variants.product_id");

    // Apply filters only if provided
    if (categoryId) {
      query = query.where("products.category_id", categoryId);
    }

    if (minPrice !== null && maxPrice !== null) {
      query = query.whereBetween("variants.price", [minPrice, maxPrice]);
    }

    // Only show items in stock (default behavior)
    if (inStock) {
      query = query.andWhere("variants.stock", ">", 0);
    }

    // Order by product name
    query = query.orderBy("products.name", "asc");

    // toNative() converts Knex's generic ? placeholders to PostgreSQL's $1,$2,...
    // toSQL() alone returns ? style which pg misparses as the JSONB operator
    const { sql, bindings } = query.toSQL().toNative();

    // Execute with error mapping (T1: PostgreSQL error codes to HTTP)
    const { rows } = await queryWithPgErrorMapping(this.dbPool, sql, bindings);

    // Transform rows into products with nested variants
    const productsMap = new Map();

    rows.forEach((row) => {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.name,
          brand: row.brand,
          description: row.description,
          variants: [],
        });
      }

      if (row.variant_id) {
        productsMap.get(row.product_id).variants.push({
          id: row.variant_id,
          size: row.size,
          price: row.price, // price in grosze
          stock: row.stock,
          sku: row.sku,
        });
      }
    });

    return Array.from(productsMap.values());
  }
}

module.exports = ProductRepository;

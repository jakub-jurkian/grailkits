class ProductRepository {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async findAllWithVariants() {
    const query = `
        SELECT 
        p.id as product_id, p.name, p.brand, p.description,
        v.id as variant_id, v.size, v.price, v.stock, v.sku
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      ORDER BY p.name ASC;
        `;

    const { rows } = await this.dbPool.query(query);

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
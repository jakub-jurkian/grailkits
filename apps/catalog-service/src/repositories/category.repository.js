const { queryWithPgErrorMapping } = require('../utils/pg');

class CategoryRepository {
  constructor(dbPool) {
    this.dbPool = dbPool; // Dependency Injection via constructor
  }
  async findAll() {
    const query = "SELECT * FROM categories ORDER BY name ASC";
    const { rows } = await queryWithPgErrorMapping(this.dbPool, query);
    return rows;
  }
}

module.exports = CategoryRepository;

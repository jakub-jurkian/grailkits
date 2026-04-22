class CategoryRepository {
  constructor(dbPool) {
    this.dbPool = dbPool; // Dependency Injection via constructor
  }
  async findAll() {
    const query = "SELECT * FROM categories ORDER BY name ASC";
    const { rows } = await this.dbPool.query(query);
    return rows;
  }
}

module.exports = CategoryRepository;

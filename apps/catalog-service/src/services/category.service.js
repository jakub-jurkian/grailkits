class CategoryService {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async getAllCategories() {
    return await this.categoryRepository.findAll();
  }
}

module.exports = CategoryService;

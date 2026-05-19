const { errorResponse } = require('../utils/errors');

class CategoryController {
  constructor(categoryService) {
    this.categoryService = categoryService;
    this.getCategories = this.getCategories.bind(this);
  }

  async getCategories(req, res) {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error('[CategoryController] Error fetching categories:', error);
      errorResponse(res, error);
    }
  }
}

module.exports = CategoryController;

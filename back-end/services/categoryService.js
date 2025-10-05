const Category = require('../models/Category');

class CategoryService {
  constructor() {
    this.categoryModel = new Category();
  }

  async getAllCategories(userId) {
    return await this.categoryModel.findByUserId(userId);
  }

  async createCategory(categoryData) {
    return await this.categoryModel.create(categoryData);
  }

  async updateCategory(id, updates) {
    return await this.categoryModel.updateById(id, updates);
  }

  async deleteCategory(id, userId) {
    return await this.categoryModel.deleteById(id, userId);
  }

  async initializeCategories(userId) {
    return await this.categoryModel.initializeDefaults(userId);
  }
}

module.exports = CategoryService;

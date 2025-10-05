const CategoryService = require('../services/categoryService');

class CategoryController {
  constructor() {
    this.categoryService = new CategoryService();
  }

  async getCategories(req, res, next) {
    try {
      const { userId } = req.query;
      console.log('🔍 GET /categories called with userId:', userId);
      
      const categories = await this.categoryService.getAllCategories(userId);
      console.log(`📋 Retrieved ${categories.length} categories for user: ${userId}`);
      
      res.json(categories);
    } catch (error) {
      console.error('❌ Error retrieving categories:', error);
      if (error.message.includes('userId is required')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;
      console.log('💾 POST /categories called for user:', categoryData.userId);
      
      const savedCategory = await this.categoryService.createCategory(categoryData);
      console.log('✅ Category saved successfully for user:', categoryData.userId);
      
      res.json(savedCategory);
    } catch (error) {
      console.error('❌ Error saving category:', error);
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log('✏️ PUT /categories/:id called for:', id);
      
      const updatedCategory = await this.categoryService.updateCategory(id, updates);
      console.log('✅ Category updated successfully:', id);
      
      res.json({
        success: true,
        ...updatedCategory,
        id: updatedCategory._id.toString()
      });
    } catch (error) {
      console.error('❌ Error updating category:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      console.log('🗑️ DELETE /categories/:id called for:', id);
      
      await this.categoryService.deleteCategory(id, userId);
      console.log('✅ Category deleted successfully:', id);
      
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async initializeCategories(req, res, next) {
    try {
      const { userId } = req.body;
      console.log('🔧 Initializing default categories for user:', userId);
      
      const categories = await this.categoryService.initializeCategories(userId);
      console.log('✅ Default categories initialized:', categories.length);
      
      res.json({ success: true, categories });
    } catch (error) {
      console.error('❌ Error initializing categories:', error);
      if (error.message.includes('userId is required')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}

module.exports = CategoryController;

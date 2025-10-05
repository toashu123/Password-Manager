const PasswordService = require('../services/passwordService');

class PasswordController {
  constructor() {
    this.passwordService = new PasswordService();
  }

  async getPasswords(req, res, next) {
    try {
      const { userId } = req.query;
      console.log('🔍 GET /passwords called with userId:', userId);
      
      const passwords = await this.passwordService.getAllPasswords(userId);
      console.log(`📋 Retrieved ${passwords.length} passwords for user: ${userId || 'all users'}`);
      
      res.json(passwords);
    } catch (error) {
      console.error('❌ Error retrieving passwords:', error);
      next(error);
    }
  }

  async createPassword(req, res, next) {
    try {
      const passwordData = req.body;
      console.log('💾 POST /passwords called for user:', passwordData.userId);
      
      const savedPassword = await this.passwordService.createPassword(passwordData);
      console.log('✅ Password saved successfully for user:', passwordData.userId);
      
      res.json(savedPassword);
    } catch (error) {
      console.error('❌ Error saving password:', error);
      if (error.message.includes('Missing required fields') || error.message.includes('userId is required')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async updatePassword(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log('✏️ PUT /passwords/:id called for:', id);
      
      const updatedPassword = await this.passwordService.updatePassword(id, updates);
      console.log('✅ Password updated successfully:', id);
      
      res.json({
        success: true,
        ...updatedPassword,
        id: updatedPassword._id.toString()
      });
    } catch (error) {
      console.error('❌ Error updating password:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async deletePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      console.log('🗑️ DELETE /passwords/:id called for:', id);
      
      await this.passwordService.deletePassword(id, userId);
      console.log('✅ Password deleted successfully:', id);
      
      res.json({ success: true, message: 'Password deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting password:', error);
      if (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}

module.exports = PasswordController;

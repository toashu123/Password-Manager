const Password = require('../models/Password');

class PasswordService {
  constructor() {
    this.passwordModel = new Password();
  }

  async getAllPasswords(userId) {
    return await this.passwordModel.findByUserId(userId);
  }

  async createPassword(passwordData) {
    // Validation
    if (!passwordData.siteService || !passwordData.username || !passwordData.password) {
      throw new Error('Missing required fields: siteService, username, password');
    }

    if (!passwordData.userId) {
      throw new Error('userId is required for user-specific storage');
    }

    return await this.passwordModel.create(passwordData);
  }

  async updatePassword(id, updates) {
    return await this.passwordModel.updateById(id, updates);
  }

  async deletePassword(id, userId) {
    return await this.passwordModel.deleteById(id, userId);
  }

  async getUserStats(userId) {
    return await this.passwordModel.getStatsByUserId(userId);
  }
}

module.exports = PasswordService;

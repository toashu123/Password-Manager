const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Password {
  // Don't initialize collection in constructor
  constructor() {
    this.collection = null;
  }

  // Lazy initialization - get collection when needed
  getCollection() {
    if (!this.collection) {
      this.collection = getDB().collection('passwords');
    }
    return this.collection;
  }

  async findByUserId(userId) {
    const query = userId ? { userId } : {};
    return await this.getCollection().find(query).sort({ createdAt: -1 }).toArray();
  }

  async create(passwordData) {
    const now = new Date().toISOString();
    passwordData.createdAt = passwordData.createdAt || now;
    passwordData.updatedAt = now;

    const result = await this.getCollection().insertOne(passwordData);
    return {
      ...passwordData,
      id: result.insertedId.toString(),
      _id: result.insertedId
    };
  }

  async updateById(id, updates) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid password ID format');
    }

    delete updates.id;
    delete updates._id;
    delete updates.createdAt;
    
    updates.updatedAt = new Date().toISOString();

    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      throw new Error('Password not found');
    }

    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async deleteById(id, userId) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid password ID format');
    }

    const query = { _id: new ObjectId(id) };
    if (userId) {
      query.userId = userId;
    }

    const result = await this.getCollection().deleteOne(query);
    
    if (result.deletedCount === 0) {
      throw new Error('Password not found or unauthorized');
    }

    return true;
  }

  async getStatsByUserId(userId) {
    const passwords = await this.getCollection().find({ userId }).toArray();
    
    return {
      total: passwords.length,
      strong: passwords.filter(p => ['Strong', 'Very Strong'].includes(p.strength)).length,
      moderate: passwords.filter(p => p.strength === 'Moderate').length,
      weak: passwords.filter(p => ['Weak', 'Very Weak'].includes(p.strength)).length,
      compromised: passwords.filter(p => p.isCompromised).length,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = Password;

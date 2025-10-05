const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Category {
  constructor() {
    this.collection = null; // Don't initialize immediately
  }

  // Lazy initialization
  getCollection() {
    if (!this.collection) {
      this.collection = getDB().collection('categories');
    }
    return this.collection;
  }

  async findByUserId(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this.getCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  async create(categoryData) {
    if (!categoryData.name || !categoryData.userId) {
      throw new Error('Missing required fields: name, userId');
    }

    const now = new Date().toISOString();
    categoryData.createdAt = now;
    categoryData.updatedAt = now;

    const result = await this.getCollection().insertOne(categoryData);
    return {
      ...categoryData,
      id: result.insertedId.toString(),
      _id: result.insertedId
    };
  }

  async updateById(id, updates) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid category ID format');
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
      throw new Error('Category not found');
    }

    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async deleteById(id, userId) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid category ID format');
    }

    const query = { _id: new ObjectId(id) };
    if (userId) {
      query.userId = userId;
    }

    const result = await this.getCollection().deleteOne(query);
    
    if (result.deletedCount === 0) {
      throw new Error('Category not found or unauthorized');
    }

    return true;
  }

  async initializeDefaults(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Check existing categories
    const existing = await this.getCollection().find({ userId }).toArray();
    if (existing.length > 0) {
      return existing;
    }

    // Default categories
    const defaultCategories = [
      { name: "Banking", icon: "🏦", color: "#059669", colorCode: "#059669" },
      { name: "Entertainment", icon: "🎬", color: "#10B981", colorCode: "#10B981" },
      { name: "Personal", icon: "👤", color: "#34D399", colorCode: "#34D399" },
      { name: "Shopping", icon: "🛒", color: "#6EE7B7", colorCode: "#6EE7B7" },
      { name: "Social Media", icon: "📱", color: "#16A34A", colorCode: "#16A34A" },
      { name: "Work", icon: "💼", color: "#22C55E", colorCode: "#22C55E" }
    ];

    const now = new Date().toISOString();
    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      userId,
      createdAt: now,
      updatedAt: now
    }));

    await this.getCollection().insertMany(categoriesToInsert);
    return await this.getCollection().find({ userId }).toArray();
  }
}

module.exports = Category;

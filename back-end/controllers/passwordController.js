const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Database Connection ---
const url = process.env.MONGODB_URI;
let db;

async function connectDB() {
    if (db) return db;
    try {
        const client = new MongoClient(url);
        await client.connect();
        db = client.db(process.env.DB_NAME || 'passop');
        console.log('✅ Connected to MongoDB Atlas');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

// --- API Routes ---

// Health check
app.get("/api/health", (req, res) => {
    res.json({ message: "Backend is healthy and running." });
});


// ========================================================================
// === PASSWORD ROUTES                                                ===
// ========================================================================

app.get("/api/passwords", async (req, res) => {
    try {
        await connectDB();
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required." });
        }
        const passwords = await db.collection('passwords').find({ userId }).sort({ createdAt: -1 }).toArray();
        console.log(`📋 Retrieved ${passwords.length} passwords for user: ${userId}`);
        res.status(200).json(passwords);
    } catch (error) {
        console.error('❌ Error in GET /api/passwords:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.post("/api/passwords", async (req, res) => {
    try {
        await connectDB();
        const passwordData = req.body;
        if (!passwordData.siteService || !passwordData.username || !passwordData.password || !passwordData.userId) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }
        const result = await db.collection('passwords').insertOne(passwordData);
        console.log('✅ Password saved successfully for user:', passwordData.userId);
        res.status(201).json({ ...passwordData, _id: result.insertedId });
    } catch (error) {
        console.error('❌ Error in POST /api/passwords:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.put("/api/passwords/:id", async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: "Invalid ID format." });
        }
        const updates = req.body;
        delete updates._id; // Prevent changing the ID
        
        const result = await db.collection('passwords').updateOne({ _id: new ObjectId(id) }, { $set: updates });
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: "Password not found." });
        }
        console.log('✅ Password updated successfully:', id);
        res.status(200).json({ success: true, message: "Password updated." });
    } catch (error) {
        console.error('❌ Error in PUT /api/passwords/:id:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.delete("/api/passwords/:id", async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: "Invalid ID format." });
        }
        const result = await db.collection('passwords').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: "Password not found." });
        }
        console.log('✅ Password deleted successfully:', id);
        res.status(200).json({ success: true, message: "Password deleted." });
    } catch (error) {
        console.error('❌ Error in DELETE /api/passwords/:id:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


// ========================================================================
// === CATEGORY ROUTES                                                ===
// ========================================================================

app.get("/api/categories", async (req, res) => {
    try {
        await connectDB();
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required." });
        }
        const categories = await db.collection('categories').find({ userId }).sort({ createdAt: -1 }).toArray();
        console.log(`📋 Retrieved ${categories.length} categories for user: ${userId}`);
        res.status(200).json(categories);
    } catch (error) {
        console.error('❌ Error in GET /api/categories:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.post("/api/categories", async (req, res) => {
    try {
        await connectDB();
        const categoryData = req.body;
        if (!categoryData.name || !categoryData.userId) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }
        const result = await db.collection('categories').insertOne(categoryData);
        console.log('✅ Category saved successfully for user:', categoryData.userId);
        res.status(201).json({ ...categoryData, _id: result.insertedId });
    } catch (error) {
        console.error('❌ Error in POST /api/categories:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.put("/api/categories/:id", async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: "Invalid ID format." });
        }
        const updates = req.body;
        delete updates._id;

        const result = await db.collection('categories').updateOne({ _id: new ObjectId(id) }, { $set: updates });
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }
        console.log('✅ Category updated successfully:', id);
        res.status(200).json({ success: true, message: "Category updated." });
    } catch (error) {
        console.error('❌ Error in PUT /api/categories/:id:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: "Invalid ID format." });
        }
        const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }
        console.log('✅ Category deleted successfully:', id);
        res.status(200).json({ success: true, message: "Category deleted." });
    } catch (error) {
        console.error('❌ Error in DELETE /api/categories/:id:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.post("/api/categories/initialize", async (req, res) => {
    try {
        await connectDB();
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: "userId is required" });
        }

        const existing = await db.collection('categories').findOne({ userId });
        if (existing) {
            console.log('ℹ️ Categories already exist for user:', userId);
            const userCategories = await db.collection('categories').find({ userId }).toArray();
            return res.status(200).json({ success: true, categories: userCategories });
        }

        const defaultCategories = [
            { name: "Banking", icon: "🏦", color: "#059669" },
            { name: "Entertainment", icon: "🎬", color: "#10B981" },
            { name: "Personal", icon: "👤", color: "#34D399" },
            { name: "Shopping", icon: "🛒", color: "#6EE7B7" },
            { name: "Social Media", icon: "📱", color: "#16A34A" },
            { name: "Work", icon: "💼", color: "#22C55E" }
        ];

        const now = new Date().toISOString();
        const categoriesToInsert = defaultCategories.map(cat => ({ ...cat, userId, createdAt: now, updatedAt: now }));
        
        await db.collection('categories').insertMany(categoriesToInsert);
        console.log('✅ Default categories initialized for user:', userId);
        res.status(201).json({ success: true, categories: categoriesToInsert });

    } catch (error) {
        console.error('❌ Error in POST /api/categories/initialize:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


// ========================================================================
// === STATS ROUTE                                                    ===
// ========================================================================

app.get("/api/stats/:userId", async (req, res) => {
    try {
        await connectDB();
        const { userId } = req.params;
        const passwords = await db.collection('passwords').find({ userId }).toArray();
        
        const stats = {
            total: passwords.length,
            strong: passwords.filter(p => ['Strong', 'Very Strong'].includes(p.strength)).length,
            moderate: passwords.filter(p => p.strength === 'Moderate').length,
            weak: passwords.filter(p => ['Weak', 'Very Weak'].includes(p.strength)).length,
            compromised: passwords.filter(p => p.isCompromised).length,
        };
        console.log('📊 User stats generated for:', userId);
        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error in GET /api/stats/:userId:', error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


// Export the Express app for Vercel
module.exports = app;

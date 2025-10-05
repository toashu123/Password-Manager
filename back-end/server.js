const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

async function startServer() {
  try {
    // Connect to database FIRST
    await connectDB();
    console.log("✅ Database connected successfully");

    // Import routes AFTER database is connected
    const passwordRoutes = require("./routes/passwords");
    const categoryRoutes = require("./routes/categories");
    const statsRoutes = require("./routes/stats");

    // Setup routes
    app.use("/passwords", passwordRoutes);
    app.use("/categories", categoryRoutes);
    app.use("/stats", statsRoutes);

    // 🔐 ADD AUTHENTICATION ROUTES HERE (for Chrome Extension)
    // Simple authentication endpoint for Chrome extension
    app.post('/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        console.log('🔐 Extension login attempt for:', email);
        
        // For testing purposes - create a simple user validation
        const validUsers = {
          'test@passop.com': 'password123',
          'admin@passop.com': 'admin123',
          'user@passop.com': 'user123',
          // Add more test credentials as needed
        };
        
        if (validUsers[email] && validUsers[email] === password) {
          // Generate a simple session token
          const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
          
          const user = {
            id: `user_${Date.now()}`,
            email: email,
            name: email.split('@')[0]
          };
          
          console.log('✅ Extension login successful for:', email);
          
          res.json({
            success: true,
            user: user,
            token: sessionToken
          });
        } else {
          console.log('❌ Extension login failed for:', email);
          res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }
      } catch (error) {
        console.error('❌ Extension authentication error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Authentication server error' 
        });
      }
    });

    // Logout endpoint for extension
    app.post('/auth/logout', (req, res) => {
      console.log('🔓 Extension logout');
      res.json({ success: true, message: 'Logged out successfully' });
    });

    // Token validation middleware for extension requests
    const authenticateExtensionToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      try {
        // Simple token validation - decode the base64 token
        const decoded = Buffer.from(token, 'base64').toString();
        const [email, timestamp] = decoded.split(':');
        
        // Check if token is not older than 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
          return res.status(403).json({ error: 'Token expired' });
        }
        
        req.userEmail = email;
        req.userId = `user_${timestamp}`;
        next();
      } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
      }
    };

    // Health check
    app.get("/health", (req, res) => {
      res.json({
        success: true,
        message: "PassOp Server is running",
        timestamp: new Date().toISOString(),
        database: "Connected to MongoDB",
        version: "1.0.0",
      });
    });

    // 🔧 FIXED: 404 Handler - Use proper catch-all syntax
    app.use("/*catchall", (req, res) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
          "POST /auth/login",           // ← Added this
          "POST /auth/logout",          // ← Added this
          "GET /passwords?userId=xxx",
          "POST /passwords",
          "PUT /passwords/:id",
          "DELETE /passwords/:id",
          "GET /categories?userId=xxx",
          "POST /categories",
          "PUT /categories/:id",
          "DELETE /categories/:id",
          "POST /categories/initialize",
          "GET /stats/:userId",
          "GET /health",
        ],
      });
    });

    // Error handling middleware
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`🚀 PassOp Server running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Extension auth: http://localhost:${PORT}/auth/login`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down PassOp server...");
  process.exit(0);
});

startServer();

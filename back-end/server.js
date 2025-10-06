const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// ✅ All routes are imported at the top level
const passwordRoutes = require("./routes/passwords");
const categoryRoutes = require("./routes/categories");
const statsRoutes = require("./routes/stats");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Setup ---
app.use(cors());
app.use(bodyParser.json());

// --- API Routes Setup ---
app.use("/api/passwords", passwordRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stats", statsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PassOp Server is running",
  });
});

// --- Error Handling ---
// A catch-all for 404 (Not Found) errors
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// The final global error handler
app.use(errorHandler);

// --- Server Startup Sequence ---
async function startServer() {
  try {
    // 1. Wait for the database connection to be successful
    await connectDB();
    console.log("✅ Database connected successfully");

    // 2. Only then, start listening for HTTP requests
    app.listen(PORT, () => {
      console.log(`🚀 PassOp Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// --- Start the server ---
startServer();

// Graceful shutdown logic (optional but good practice)
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down PassOp server...");
  process.exit(0);
});
import express from "express";
import { createRoutes } from "./routes.js";
import { FallbackStorage } from "./storage.js";
import { setupVite } from "./vite.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5004;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware removed for production

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

async function startServer() {
  try {
    // Initialize storage (with database fallback for dashboard functionality)
    const storage = new FallbackStorage();
    
    // Setup API routes with SSE support
    const apiRouter = createRoutes(storage);
    app.use("/api", apiRouter);
    
    // Setup Vite for serving the frontend
    await setupVite(app);
    
    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Dashboard app running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
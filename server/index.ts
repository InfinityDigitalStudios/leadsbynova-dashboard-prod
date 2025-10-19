import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { validateForkIsolation, getForkConfig, ForkValidationError } from "./fork-validation";
import { validateEnvironment, printEnvironmentStatus, getEnvironmentSetupInstructions, EnvironmentValidationError } from "./environment-validation";
import path from "path";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // 🔧 Comprehensive Environment Validation
  // Validates all required environment variables with clear setup guidance
  let environmentConfig;
  try {
    log("🔍 Validating environment configuration...");
    environmentConfig = validateEnvironment();
    printEnvironmentStatus(environmentConfig);
    log("✅ Environment validation successful");
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      log(`❌ Environment Validation Failed: ${error.message}`);
      log(`Error Code: ${error.code}`);
      log("");
      
      const instructions = getEnvironmentSetupInstructions(error);
      instructions.forEach(instruction => log(instruction));
      
      log("");
      log("💡 Proper environment setup ensures fork isolation and prevents data leakage");
      process.exit(1);
    }
    
    throw error; // Re-throw unexpected errors
  }

  // 🔒 Fork Isolation Validation - Critical Security Check
  // This prevents database sharing between forks and ensures data isolation
  try {
    log("🔍 Validating fork isolation...");
    const forkConfig = getForkConfig();
    await validateForkIsolation(forkConfig);
    log("✅ Fork isolation validated successfully");
  } catch (error) {
    if (error instanceof ForkValidationError) {
      log(`❌ Fork Validation Failed: ${error.message}`);
      log(`Error Code: ${error.code}`);
      log("");
      log("📋 To fix this issue:");
      
      if (error.code === 'MISSING_FORK_ID') {
        log("   1. Set a unique FORK_ID environment variable (e.g., 'my-realestate-app')");
        log("   2. This identifies your fork and prevents database conflicts");
      } else if (error.code === 'MISSING_DATABASE_URL') {
        log("   1. Provision a new database for this fork");
        log("   2. Set DATABASE_URL to your unique database connection");
      } else if (error.code === 'DATABASE_URL_MISMATCH' || error.code === 'DATABASE_URL_IN_USE') {
        log("   1. Each fork MUST have its own unique DATABASE_URL");
        log("   2. Create a new database for this fork");
        log("   3. Update DATABASE_URL to point to your private database");
      }
      
      log("");
      log("💡 Fork isolation prevents your leads from appearing in other dashboards");
      process.exit(1);
    }
    
    throw error; // Re-throw unexpected errors
  }
  
  log(`Agent notifications configured for: ${environmentConfig.emailTo}`);

  // Initialize default configurations and agents
  try {
    log("Initializing default configurations and agents...");
    await storage.initializeDefaults();
    log("✅ Storage initialization completed");
  } catch (error) {
    log(`⚠️ Storage initialization failed, continuing anyway: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const server = await registerRoutes(app);

  // Serve static assets from attached_assets directory
  const attachedAssetsPath = path.resolve(import.meta.dirname, "..", "attached_assets");
  app.use("/attached_assets", express.static(attachedAssetsPath));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = environmentConfig.port;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

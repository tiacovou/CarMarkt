import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDb } from "./db";
import { storage, setStorageImplementation } from "./storage";
import { DatabaseStorage } from "./db-storage";

const app = express();
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
  // Initialize database connection
  try {
    // Initialize database and storage
    const { db, pool } = await initDb();
    
    // Replace in-memory storage with database storage
    // Use type assertion to bypass TypeScript type issues
    const dbStorage = new DatabaseStorage(db as any, pool);
    setStorageImplementation(dbStorage);
    
    console.log("Database connection established successfully");
    
    // Seed the database with initial data if needed
    // Run database seed script after server starts
    setTimeout(() => {
      console.log("Running database seed script...");
      // Use dynamic import to avoid TypeScript errors
      import('child_process').then(cp => {
        cp.exec("tsx seed-db.ts", (error, stdout, stderr) => {
          if (error) {
            console.error(`Seed script error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Seed script stderr: ${stderr}`);
            return;
          }
          console.log(`Seed script output: ${stdout}`);
        });
      }).catch(error => {
        console.error("Failed to import child_process:", error);
      });
    }, 5000); // Wait 5 seconds after server starts
    
    // Schedule expired listings cleanup to run every hour
    setInterval(() => {
      storage.cleanupExpiredListings().catch(err => {
        console.error("Error cleaning up expired listings:", err);
      });
    }, 60 * 60 * 1000); // 1 hour
    
  } catch (error) {
    console.error("Failed to initialize database:", error);
    console.warn("Falling back to in-memory storage");
  }
  
  const server = await registerRoutes(app);

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

export async function setupVite(app: express.Application) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
    });

    // Use vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  } else {
    // Production mode - serve static files
    const distPath = path.resolve(process.cwd(), "dist/public");
    
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: false,
      lastModified: false,
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }));

    // Fallback to index.html for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}
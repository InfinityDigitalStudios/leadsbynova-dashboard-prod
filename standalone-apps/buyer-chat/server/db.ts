import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close a connection after 7500 uses (optional)
  maxLifetimeSeconds: 60 * 30, // Close a connection after 30 minutes (optional)
  allowExitOnIdle: true // Allow the process to exit when all clients are idle
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle pool client', err);
});

export const db = drizzle({ client: pool, schema });

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// Initialize the database connection
export const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a Postgres connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create a drizzle instance
  const db = drizzle(pool, { schema });

  try {
    // Run migrations
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully");
    
    return { db, pool };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};
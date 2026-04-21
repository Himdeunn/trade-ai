import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not defined. Database connection will fail if used.");
}

const sql = neon(connectionString || "");
export const db = drizzle(sql, { schema });

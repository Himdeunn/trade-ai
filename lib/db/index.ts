import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Temporary mock to allow deployment without DB
const mockDb = {
  query: new Proxy({}, {
    get: () => ({
      findMany: async () => [],
      findFirst: async () => null,
    })
  }),
  insert: () => ({ values: () => ({ returning: () => [{}], onConflictDoNothing: () => Promise.resolve() }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  delete: () => ({ where: () => Promise.resolve() }),
  select: () => ({ from: () => ({ where: () => ({ limit: () => [] }), limit: () => [] }) }),
  execute: async () => ({ rows: [] }),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export const db = connectionString ? drizzle(neon(connectionString), { schema }) : mockDb;

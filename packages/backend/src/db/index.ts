import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Creates a DrizzleORM database client for a Cloudflare Workers request.
 * A new client is created per-request because Workers are stateless and
 * the DATABASE_URL lives in the Worker's environment bindings.
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __kaloPgPool: Pool | undefined;
}

const pool =
  global.__kaloPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__kaloPgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };

import { Pool } from "pg";

let pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  global.pgPool.on("error", (err) => {
    console.error("Unexpected error on idle pg client:", err.message);
  });
}
pool = global.pgPool;

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query execution error:", error);
    throw error;
  }
}

/**
 * Acquire a dedicated client from the pool for running transactions.
 * Usage:
 *   const client = await getClient();
 *   try {
 *     await client.query("BEGIN");
 *     // ... queries ...
 *     await client.query("COMMIT");
 *   } catch (err) {
 *     await client.query("ROLLBACK");
 *     throw err;
 *   } finally {
 *     client.release();
 *   }
 */
export async function getClient() {
  return pool.connect();
}


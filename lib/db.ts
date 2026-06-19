import { drizzle } from "drizzle-orm/mssql";
import { Pool } from "mssql";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("SQL Server pool error:", err);
});

export const db = drizzle(pool, { schema });

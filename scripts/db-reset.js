// scripts/db-reset.js
// Destructive: Drop all tables and database to start fresh
// Requires confirmation by typing 'DESTROY DATABASE'
// Run with: npm run db:reset

import dotenv from "dotenv";
import readline from "readline";
import sql from "mssql";

dotenv.config({ path: ".env.local" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function resetDatabase() {
  try {
    console.log("\n🗑️  Connecting to SQL Server...");

    const config = {
      server: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || "1433"),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
    };

    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected\n");

    console.log("🔄 Dropping all tables...");
    await pool.request().query(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql += 'DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + '; '
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE';
      EXEC sp_executesql @sql;
    `);
    console.log("✅ All tables dropped");

    console.log("🔄 Clearing migration history...");
    await pool.request().query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'knex_migrations')
      DELETE FROM knex_migrations;
    `);
    console.log("✅ Migration history cleared\n");

    await pool.close();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error?.message || error);
    rl.close();
    process.exit(1);
  }
}

resetDatabase();

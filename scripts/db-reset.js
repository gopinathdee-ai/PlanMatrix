// scripts/db-reset.js
// Destructive: Drop all tables and database to start fresh
// Requires confirmation by typing 'DESTROY DATABASE'
// Run with: npm run db:reset

import knex from "knex";
import readline from "readline";
import knexConfig from "../knexfile.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function resetDatabase() {
  const db = knex(knexConfig.development);
  
  try {
    console.log("\n🗑️  Connecting to SQL Server...");
    
    // Test connection
    await db.raw('SELECT 1');
    console.log("✅ Connected\n");

    console.log("🔄 Dropping all tables...");
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql += 'DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + '; '
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE';
      EXEC sp_executesql @sql;
    `);
    console.log("✅ All tables dropped");

    console.log("🔄 Clearing migration history...");
    await db.raw(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'knex_migrations')
      DELETE FROM knex_migrations;
    `);
    console.log("✅ Migration history cleared\n");

    await db.destroy();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error?.message || error);
    if (db) await db.destroy();
    rl.close();
    process.exit(1);
  }
}

resetDatabase();

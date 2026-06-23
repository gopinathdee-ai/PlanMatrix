// scripts/test-connection.js
// Quick test to verify database connection with Knex
// Run with: node scripts/test-connection.js

import knex from "knex";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const db = knex({
  client: "mssql",
  connection: {
    server: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "1433"),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  },
});

async function testConnection() {
  try {
    console.log("\n🔄 Testing database connection with Knex...\n");

    await db.raw("SELECT 1");

    console.log("✅ Connection successful!\n");
    console.log("Connected to:");
    console.log(`   Database: ${process.env.DATABASE_NAME}`);
    console.log(`   Server: ${process.env.DATABASE_HOST}\n`);

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error?.message || error);
    console.error("\nTroubleshooting:");
    console.error("   1. Verify DATABASE_* variables in .env.local");
    console.error("   2. Check SQL Server is running");
    console.error("   3. Verify username/password are correct");
    console.error("   4. Verify the database and user were created\n");
    process.exit(1);
  }
}

testConnection();

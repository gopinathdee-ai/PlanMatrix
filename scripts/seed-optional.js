// scripts/seed-optional.js
// Optional seeding - for test/demo data only
// Run with: npm run db:seed:optional
// This is only run when needed for testing/development

require("dotenv").config({ path: ".env.local" });
const sql = require("mssql");
const { db } = require("../lib/db");

async function seedOptional() {
  try {
    console.log("\n========================================");
    console.log("🌱 Seeding Optional Data (Test/Demo)");
    console.log("========================================\n");

    // TODO: Add your optional test/demo seeding logic here
    // Examples:
    // - Sample users for testing
    // - Sample floor plans
    // - Sample assignments
    // - Sample buildings/floors

    console.log("✅ Optional seeding completed\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding optional data:", error?.message || error);
    process.exit(1);
  }
}

seedOptional();

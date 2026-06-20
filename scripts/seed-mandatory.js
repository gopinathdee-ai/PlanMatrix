// scripts/seed-mandatory.js
// Mandatory seeding - creates essential data needed for the application to function
// Run with: npm run db:seed:mandatory

require("dotenv").config({ path: ".env.local" });
const sql = require("mssql");
const { db } = require("../lib/db");

async function seedMandatory() {
  try {
    console.log("\n========================================");
    console.log("🌱 Seeding Mandatory Data");
    console.log("========================================\n");

    // TODO: Add your mandatory seeding logic here
    // Examples:
    // - Admin user
    // - Default roles/permissions
    // - System settings
    // - Required enums/constants

    console.log("✅ Mandatory seeding completed\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding mandatory data:", error?.message || error);
    process.exit(1);
  }
}

seedMandatory();

// scripts/init-db-complete.js
// Complete database initialization with user creation
// Run with: npm run db:initialize:complete

const sql = require("mssql");

async function initializeDatabase() {
  // Parse connection string from DATABASE_URL (using sa account for setup)
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  // Parse connection details
  const serverMatch = dbUrl.match(/Server=([^;]+)/i);
  const databaseMatch = dbUrl.match(/Database=([^;]+)/i);
  const userMatch = dbUrl.match(/User Id=([^;]+)/i);
  const passwordMatch = dbUrl.match(/Password=([^;]+)/i);
  const encryptMatch = dbUrl.match(/Encrypt=([^;]+)/i);

  const server = serverMatch ? serverMatch[1] : "localhost";
  const database = databaseMatch ? databaseMatch[1] : "floorplan_db";
  const userName = userMatch ? userMatch[1] : "sa";
  const password = passwordMatch ? passwordMatch[1] : "";
  const encrypt = encryptMatch ? encryptMatch[1].toLowerCase() === "true" : false;

  // Generate random password for application user
  const appUserPassword = generateRandomPassword(14);

  const config = {
    server: server,
    authentication: {
      type: "default",
      options: {
        userName: userName,
        password: password,
      },
    },
    options: {
      encrypt: encrypt,
      trustServerCertificate: true,
      connectTimeout: 15000,
    },
  };

  try {
    console.log("\n========================================");
    console.log("🚀 Floor Plan System - Database Setup");
    console.log("========================================\n");

    console.log("🔄 Connecting to SQL Server...");
    console.log(`   Server: ${server}`);
    console.log(`   User: ${userName}\n`);

    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected to SQL Server\n");

    // Step 1: Create Database
    console.log("📦 Step 1: Creating database...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${database}')
      BEGIN
        CREATE DATABASE ${database};
      END
    `);
    console.log(`✅ Database [${database}] ready\n`);

    // Step 2: Create Login
    console.log("👤 Step 2: Creating application user...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'floorplan_user')
      BEGIN
        CREATE LOGIN floorplan_user WITH PASSWORD = '${appUserPassword}';
      END
    `);
    console.log(`✅ Login [floorplan_user] created\n`);

    // Step 3: Switch to database and create user
    console.log("🔐 Step 3: Setting up database permissions...");
    await pool.request().query(`
      USE [${database}];
      IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'floorplan_user')
      BEGIN
        CREATE USER floorplan_user FOR LOGIN floorplan_user;
      END
    `);

    // Grant permissions
    await pool.request().query(`
      USE [${database}];
      GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO floorplan_user;
      GRANT CREATE TABLE TO floorplan_user;
      GRANT ALTER ON SCHEMA::dbo TO floorplan_user;
    `);
    console.log(`✅ Permissions granted\n`);

    // Summary
    console.log("========================================");
    console.log("✅ DATABASE SETUP COMPLETE");
    console.log("========================================\n");

    console.log("📋 New Application User Created:");
    console.log(`   Username: floorplan_user`);
    console.log(`   Password: ${appUserPassword}\n`);

    console.log("📝 Update your .env.local with:");
    console.log(
      `DATABASE_URL="Server=${server};Database=${database};User Id=floorplan_user;Password=${appUserPassword};Encrypt=${encrypt};"`
    );
    console.log("\n");

    console.log("🚀 Next Steps:");
    console.log("   1. Update .env.local with the new connection string above");
    console.log("   2. npm run db:generate");
    console.log("   3. npm run db:push");
    console.log("   4. npm run dev\n");

    console.log("💾 Save the password securely!");
    console.log("   (Store it in Azure Key Vault or password manager)\n");

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    console.error("\n🔍 Troubleshooting:");
    console.error("   1. Check SQL Server is running");
    console.error("   2. Verify DATABASE_URL in .env.local");
    console.error("   3. Verify username/password are correct");
    console.error("   4. Check firewall allows SQL Server connection\n");
    process.exit(1);
  }
}

// Generate random password
function generateRandomPassword(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

initializeDatabase();
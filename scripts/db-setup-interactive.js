// scripts/db-setup-interactive.js
// Interactive database setup script
// Generates a secure password and creates database + user
// Run with: node scripts/db-setup-interactive.js

import sql from "mssql";
import crypto from "crypto";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateSecurePassword(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const buffer = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[buffer[i] % chars.length];
  }
  return password;
}

async function setupDatabase() {
  try {
    console.log("\n========================================");
    console.log("🗄️  Interactive Database Setup");
    console.log("========================================\n");

    rl.question(
      "Do you want to create the floorplan_user login? (yes/no): ",
      async (answer) => {
        if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
          console.log("\n❌ Setup cancelled.\n");
          rl.close();
          process.exit(0);
        }

        try {
          // Generate secure password
          const generatedPassword = generateSecurePassword(16);

          console.log("\n🔄 Connecting to SQL Server...");
          console.log(`   Server: ${process.env.DATABASE_HOST}`);
          console.log(`   Using Windows Authentication\n`);

          // Connect with Windows auth to create the login
          const config = {
            server: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || "1433"),
            database: process.env.DATABASE_NAME,
            authentication: {
              type: "default",
              options: {
                userName: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
              },
            },
            options: {
              encrypt: false,
              trustServerCertificate: true,
              connectTimeout: 15000,
            },
          };

          const pool = new sql.ConnectionPool(config);
          await pool.connect();
          console.log("✅ Connected to SQL Server\n");

          // Create login
          console.log("👤 Creating login for floorplan_user...");
          try {
            await pool.request().query(`
              IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'floorplan_user')
              BEGIN
                CREATE LOGIN floorplan_user WITH PASSWORD = '${generatedPassword}';
                PRINT 'Login created successfully';
              END
              ELSE
              BEGIN
                PRINT 'Login already exists';
              END
            `);
            console.log("✅ Login created/verified\n");
          } catch (loginError) {
            console.error("⚠️  Error creating login:", loginError.message);
          }

          // Grant permissions to user in database
          console.log("🔐 Setting up database permissions...");
          try {
            await pool.request().query(`
              USE [${process.env.DATABASE_NAME}];
              IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'floorplan_user')
              BEGIN
                CREATE USER floorplan_user FOR LOGIN floorplan_user;
              END
              GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO floorplan_user;
              GRANT CREATE TABLE TO floorplan_user;
              GRANT ALTER ON SCHEMA::dbo TO floorplan_user;
            `);
            console.log("✅ Permissions granted\n");
          } catch (permError) {
            console.error("⚠️  Error setting permissions:", permError.message);
          }

          await pool.close();

          // Display results
          console.log("========================================");
          console.log("✅ DATABASE SETUP COMPLETE");
          console.log("========================================\n");

          console.log("📋 Generated Credentials:");
          console.log(`   Username: floorplan_user`);
          console.log(`   Password: ${generatedPassword}\n`);

          console.log("📝 Update your .env.local file:");
          console.log(`DATABASE_HOST=${process.env.DATABASE_HOST}`);
          console.log(`DATABASE_PORT=${process.env.DATABASE_PORT || "1433"}`);
          console.log(`DATABASE_NAME=${process.env.DATABASE_NAME}`);
          console.log(`DATABASE_USER=floorplan_user`);
          console.log(`DATABASE_PASSWORD=${generatedPassword}\n`);

          console.log("🚀 Next Steps:");
          console.log("   1. Copy the password above");
          console.log("   2. Update DATABASE_PASSWORD in .env.local");
          console.log("   3. Run: npm run db:migrate");
          console.log("   4. Run: npm run db:seed:mandatory\n");

          console.log("💾 Save the password securely!");
          console.log("   (Store it in Azure Key Vault or password manager)\n");

          rl.close();
          process.exit(0);
        } catch (error) {
          console.error("\n❌ Error during setup:", error.message);
          rl.close();
          process.exit(1);
        }
      }
    );
  } catch (error) {
    console.error("❌ Error:", error?.message || error);
    rl.close();
    process.exit(1);
  }
}

setupDatabase();

// scripts/db-reset-create.js
// Complete reset workflow: reset → migrate → seed mandatory
// Run with: npm run db:reset:create
// Requires confirmation before destructive operations

import { spawn } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commands = [
  { cmd: "npm", args: ["run", "db:reset"], name: "Database Reset" },
  { cmd: "npm", args: ["run", "db:migrate"], name: "Run Migrations" },
  {
    cmd: "npm",
    args: ["run", "db:seed:mandatory"],
    name: "Seed Mandatory Data",
  },
];

async function runCommand(cmd, args, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  ${name}...`);
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} failed with code ${code}`));
      }
    });
  });
}

async function runWorkflow() {
  try {
    console.log("\n========================================");
    console.log("🔄 Complete Database Reset & Setup");
    console.log("========================================");
    console.log("\n⚠️  This will:");
    console.log("   • DROP all tables and data");
    console.log("   • Generate new migrations");
    console.log("   • Create all tables");
    console.log("   • Seed mandatory data\n");

    rl.question(
      'Type "\x1b[1m\x1b[41mDESTROY DATABASE\x1b[0m" to confirm (or press Enter to cancel): ',
      async (answer) => {
        if (answer !== "DESTROY DATABASE") {
          console.log("\n❌ Operation cancelled.\n");
          rl.close();
          process.exit(0);
        }

        try {

          for (const { cmd, args, name } of commands) {
            await runCommand(cmd, args, name);
          }

          console.log("\n========================================");
          console.log("✅ COMPLETE DATABASE SETUP FINISHED");
          console.log("========================================\n");
          console.log("Database is ready to use!");
          console.log("Run: npm run dev\n");

          rl.close();
          process.exit(0);
        } catch (error) {
          console.error("\n❌ Error:", error.message);
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

runWorkflow();

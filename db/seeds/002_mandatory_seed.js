import crypto from "crypto";
import bcrypt from "bcrypt";

function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  const buffer = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[buffer[i] % chars.length];
  }
  return password;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Delete existing entries
  await knex("users").del();

  const adminPassword = generateRandomPassword(10);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await knex("users").insert({
    email: "admin@planmatrix.local",
    name: "Admin",
    department: "IT",
    is_it_admin: true,
    status: "active",
    password_hash: passwordHash,
  });

  console.log("\n✅ Mandatory seed completed!");
  console.log("Admin Account Created:");
  console.log(`   Email: admin@planmatrix.local`);
  console.log(`   Password: ${adminPassword}`);
  console.log("   (Store this password securely!)\n");
}

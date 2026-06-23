// lib/db-config.js
// Database configuration for Knex
// Uses individual environment variables instead of connection strings

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
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
      enableKeepAlive: true,
    },
  },
};

// knexfile.js - Knex.js configuration for database migrations
// This file defines how to connect to the database and run migrations

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  // Development environment
  development: {
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
    migrations: {
      directory: "./db/migrations",
      extension: "js",
    },
    seeds: {
      directory: "./db/seeds",
      extension: "js",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  // Production environment
  production: {
    client: "mssql",
    connection: {
      server: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || "1433"),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      options: {
        trustServerCertificate: false,
        encrypt: true,
        enableKeepAlive: true,
      },
    },
    migrations: {
      directory: "./db/migrations",
      extension: "js",
    },
    seeds: {
      directory: "./db/seeds",
      extension: "js",
    },
    pool: {
      min: 5,
      max: 30,
    },
  },
};

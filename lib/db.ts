import knex from "knex";
import dbConfig from "@/lib/db-config";

export const db = knex({
  ...dbConfig,
  debug: process.env.NODE_ENV === "development",
});

import "server-only";

import knex from "knex";
import config from "./db-config";
import { randomUUID } from "crypto";

// Initialize Knex singleton
const k = knex(config);

/**
 * Database utility function
 * Returns a Knex query builder for the specified table
 */
export function db(table: string) {
  const queryBuilder = k(table);

  // We extend the builder with compatibility helpers
  const originalInsert = queryBuilder.insert.bind(queryBuilder);
  const originalCount = queryBuilder.count.bind(queryBuilder);

  // Handle legacy UUID generation for inserts
  queryBuilder.insert = function(data: any, returning?: any) {
    if (data && !Array.isArray(data) && !data.id) {
      data.id = randomUUID();
      const result = originalInsert.call(this, data, returning);
      return Promise.resolve(result).then(() => [data.id]);
    }
    return originalInsert.call(this, data, returning);
  };

  // Handle legacy count behavior to ensure the alias is always 'count'
  queryBuilder.count = function(...args: any[]) {
    let countArg: any = "*";
    let alias = "count";

    if (args.length === 2) {
      // Handle db().count(column, alias)
      countArg = args[0];
      alias = args[1];
    } else if (args.length === 1 && typeof args[0] === "string") {
      // Handle db().count(column)
      countArg = args[0];
    }
    
    // Convert to Knex object-based count to ensure consistent alias
    return originalCount.call(this, { [alias]: countArg });
  };

  return queryBuilder;
}

// Export the raw knex instance
export { k as knex };

import "server-only";

import sql from "mssql";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

let _pool: sql.ConnectionPool | null = null;

async function getPool(): Promise<sql.ConnectionPool> {
  if (!_pool) {
    _pool = new sql.ConnectionPool({
      server: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableKeepAlive: true,
      },
    });
    await _pool.connect();
  }
  return _pool;
}

class QueryBuilder {
  private table: string;
  private selectCols: string[] = ["*"];
  private whereClauses: { column: string; operator: string; value: any }[] = [];
  private orderByCols: { column: string; direction: string }[] = [];
  private joinClauses: { table: string; on: string; type: string }[] = [];
  private insertData: Record<string, any> | null = null;
  private countColumn = "*";
  private isDelete = false;
  private _first = false;

  constructor(table: string) {
    this.table = table;
  }

  select(...columns: string[]): this {
    if (columns.length > 0) {
      this.selectCols = columns;
    }
    return this;
  }

  where(column: string, value: any): this;
  where(column: string, operator: string, value: any): this;
  where(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this.whereClauses.push({ column, operator: "=", value: operatorOrValue });
    } else {
      this.whereClauses.push({ column, operator: operatorOrValue, value });
    }
    return this;
  }

  whereNotNull(column: string): this {
    this.whereClauses.push({ column, operator: "IS NOT NULL", value: null });
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc" = "asc"): this {
    this.orderByCols.push({ column, direction });
    return this;
  }

  leftJoin(table: string, on: string): this {
    this.joinClauses.push({ table, on, type: "LEFT" });
    return this;
  }

  count(column = "*", alias = "count"): this {
    this.countColumn = `COUNT(${column === "*" ? "*" : column}) as ${alias}`;
    return this;
  }

  insert(data: Record<string, any>): this {
    this.insertData = data;
    return this;
  }

  del(): this {
    this.isDelete = true;
    return this;
  }

  first(): this {
    this._first = true;
    return this;
  }

  then(onFulfilled?: any, onRejected?: any): any {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected?: any): any {
    return this.execute().catch(onRejected);
  }

  async execute(): Promise<any> {
    const pool = await getPool();
    let query = "";
    const inputs = new Map<string, any>();
    let paramIndex = 1;

    if (this.isDelete) {
      query = `DELETE FROM ${this.table}`;
      let whereAdded = false;
      for (const clause of this.whereClauses) {
        const paramName = `p${paramIndex++}`;
        const prefix = whereAdded ? " AND" : " WHERE";
        if (clause.operator === "IS NOT NULL") {
          query += `${prefix} ${clause.column} IS NOT NULL`;
        } else {
          query += `${prefix} ${clause.column} ${clause.operator} @${paramName}`;
          inputs.set(paramName, clause.value);
        }
        whereAdded = true;
      }

      const request = pool.request();
      inputs.forEach((value, key) => {
        request.input(key, value);
      });

      await request.query(query);
      return [];
    } else if (this.insertData) {
      const generatedId = randomUUID();
      const columns = ["id", ...Object.keys(this.insertData)];
      const values = [];

      inputs.set(`p${paramIndex}`, generatedId);
      values.push(`@p${paramIndex++}`);

      Object.entries(this.insertData).forEach(([key, value]) => {
        const paramName = `p${paramIndex++}`;
        inputs.set(paramName, value);
        values.push(`@${paramName}`);
      });

      query = `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${values.join(", ")})`;

      const request = pool.request();
      inputs.forEach((value, key) => {
        request.input(key, value);
      });

      await request.query(query);
      return [generatedId];
    } else {
      const selectList = this.countColumn !== "*" ? this.countColumn : this.selectCols.join(", ");
      query = `SELECT ${selectList} FROM ${this.table}`;

      for (const join of this.joinClauses) {
        query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
      }

      let whereAdded = false;
      for (const clause of this.whereClauses) {
        const paramName = `p${paramIndex++}`;
        const prefix = whereAdded ? " AND" : " WHERE";
        if (clause.operator === "IS NOT NULL") {
          query += `${prefix} ${clause.column} IS NOT NULL`;
        } else {
          query += `${prefix} ${clause.column} ${clause.operator} @${paramName}`;
          inputs.set(paramName, clause.value);
        }
        whereAdded = true;
      }

      for (const order of this.orderByCols) {
        query += ` ORDER BY ${order.column} ${order.direction.toUpperCase()}`;
      }

      const request = pool.request();
      inputs.forEach((value, key) => {
        request.input(key, value);
      });

      const result = await request.query(query);

      if (this._first) {
        return result.recordset[0] || null;
      }

      return result.recordset;
    }
  }
}

export function db(table: string): QueryBuilder {
  return new QueryBuilder(table);
}

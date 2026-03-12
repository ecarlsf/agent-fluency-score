import pg from "pg";
import fs from "fs";
import path from "path";

export async function getDbClient(): Promise<pg.Client> {
  const appDir = process.env.APP_DIR;
  if (!appDir) throw new Error("APP_DIR not set");
  const envContent = fs.readFileSync(path.resolve(appDir, ".env"), "utf-8");
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env");
  const client = new pg.Client({ connectionString: match[1].trim().replace(/^["']|["']$/g, "") });
  await client.connect();
  return client;
}

/**
 * Find a table by trying multiple candidate names (case-insensitive).
 * Handles Prisma PascalCase, Drizzle snake_case, pluralized, etc.
 */
export async function findTable(
  client: pg.Client,
  candidates: string[]
): Promise<string | null> {
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND LOWER(table_name) = ANY($1::text[])`,
    [candidates.map((c) => c.toLowerCase())]
  );
  return res.rows.length > 0 ? res.rows[0].table_name : null;
}

/**
 * Check which columns exist on a table, supporting variant names.
 * Each entry in columnVariants is an array of possible names for the same column.
 * Returns { found: string[], missing: string[][] }.
 */
export async function tableHasColumns(
  client: pg.Client,
  table: string,
  columnVariants: string[][]
): Promise<{ found: string[]; missing: string[][] }> {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  const existing = new Set(res.rows.map((r) => r.column_name.toLowerCase()));

  const found: string[] = [];
  const missing: string[][] = [];

  for (const variants of columnVariants) {
    const match = variants.find((v) => existing.has(v.toLowerCase()));
    if (match) {
      found.push(match);
    } else {
      missing.push(variants);
    }
  }

  return { found, missing };
}

/**
 * Find the actual column name among variant candidates.
 */
export async function findColumn(
  client: pg.Client,
  table: string,
  candidates: string[]
): Promise<string> {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
       AND LOWER(column_name) = ANY($2::text[])`,
    [table, candidates.map((c) => c.toLowerCase())]
  );
  if (res.rows.length === 0) {
    throw new Error(
      `No column matching [${candidates.join(", ")}] found in table "${table}"`
    );
  }
  return res.rows[0].column_name;
}

/**
 * Get row count for a table.
 */
export async function getRowCount(
  client: pg.Client,
  table: string
): Promise<number> {
  const res = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  return res.rows[0].count;
}

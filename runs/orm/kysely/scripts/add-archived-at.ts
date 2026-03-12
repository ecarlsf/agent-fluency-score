import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "../src/lib/db";

async function main() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString:
          process.env.DATABASE_URL ||
          "postgresql://postgres:postgres@localhost:5432/afs_orm_kysely",
      }),
    }),
  });

  await db.schema
    .alterTable("tasks")
    .addColumn("archived_at", "varchar(50)")
    .execute();

  console.log("Added archived_at column to tasks table");
  await db.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

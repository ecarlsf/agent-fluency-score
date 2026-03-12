import { Kysely, PostgresDialect, Generated, ColumnType } from "kysely";
import { Pool } from "pg";

// ---------------------------------------------------------------------------
// Table interfaces — these define the database schema for Kysely
// ---------------------------------------------------------------------------

export interface OrganizationTable {
  id: Generated<number>;
  name: string;
  slug: string;
}

export interface UserTable {
  id: Generated<number>;
  name: string;
  email: string;
  role: "admin" | "member" | "viewer";
  organization_id: number;
}

export interface ProjectTable {
  id: Generated<number>;
  name: string;
  description: string;
  status: "active" | "archived" | "planning";
  organization_id: number;
}

export interface TaskTable {
  id: Generated<number>;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_at: ColumnType<string, string | undefined, string>;
  project_id: number;
  assignee_id: number | null;
  archived_at: string | null;
}

// ---------------------------------------------------------------------------
// Database interface — maps table names to their types
// ---------------------------------------------------------------------------

export interface Database {
  organizations: OrganizationTable;
  users: UserTable;
  projects: ProjectTable;
  tasks: TaskTable;
}

// ---------------------------------------------------------------------------
// Singleton database instance
// ---------------------------------------------------------------------------

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

export const db = new Kysely<Database>({ dialect });

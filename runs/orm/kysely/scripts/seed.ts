import { Kysely, PostgresDialect, sql } from "kysely";
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

  console.log("Creating tables...");

  // Drop tables in reverse dependency order
  await db.schema.dropTable("tasks").ifExists().execute();
  await db.schema.dropTable("projects").ifExists().execute();
  await db.schema.dropTable("users").ifExists().execute();
  await db.schema.dropTable("organizations").ifExists().execute();

  // Create organizations
  await db.schema
    .createTable("organizations")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("slug", "varchar(255)", (col) => col.notNull().unique())
    .execute();

  // Create users
  await db.schema
    .createTable("users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("role", "varchar(50)", (col) => col.notNull())
    .addColumn("organization_id", "integer", (col) =>
      col.notNull().references("organizations.id")
    )
    .execute();

  // Create projects
  await db.schema
    .createTable("projects")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("status", "varchar(50)", (col) => col.notNull())
    .addColumn("organization_id", "integer", (col) =>
      col.notNull().references("organizations.id")
    )
    .execute();

  // Create tasks
  await db.schema
    .createTable("tasks")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("title", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("status", "varchar(50)", (col) => col.notNull())
    .addColumn("priority", "varchar(50)", (col) => col.notNull())
    .addColumn("due_date", "varchar(50)")
    .addColumn("created_at", "varchar(50)", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("project_id", "integer", (col) =>
      col.notNull().references("projects.id")
    )
    .addColumn("assignee_id", "integer", (col) => col.references("users.id"))
    .addColumn("archived_at", "varchar(50)")
    .execute();

  console.log("Tables created. Seeding data...");

  // Seed organizations
  await db
    .insertInto("organizations")
    .values([
      { id: 1, name: "Acme Corp", slug: "acme-corp" },
      { id: 2, name: "Globex Industries", slug: "globex-industries" },
      { id: 3, name: "Initech Solutions", slug: "initech-solutions" },
    ])
    .execute();

  // Seed users
  await db
    .insertInto("users")
    .values([
      { id: 1, name: "Alice Johnson", email: "alice@acme.com", role: "admin", organization_id: 1 },
      { id: 2, name: "Bob Smith", email: "bob@acme.com", role: "member", organization_id: 1 },
      { id: 3, name: "Carol Williams", email: "carol@globex.com", role: "admin", organization_id: 2 },
      { id: 4, name: "Dave Brown", email: "dave@globex.com", role: "member", organization_id: 2 },
      { id: 5, name: "Eve Davis", email: "eve@initech.com", role: "viewer", organization_id: 3 },
    ])
    .execute();

  // Seed projects
  await db
    .insertInto("projects")
    .values([
      { id: 1, name: "Website Redesign", description: "Complete overhaul of the company website with modern design", status: "active", organization_id: 1 },
      { id: 2, name: "Mobile App v2", description: "Second major version of the mobile application", status: "active", organization_id: 1 },
      { id: 3, name: "Data Pipeline", description: "Build ETL pipeline for analytics data processing", status: "planning", organization_id: 2 },
      { id: 4, name: "API Gateway", description: "Centralized API gateway for microservices architecture", status: "active", organization_id: 2 },
      { id: 5, name: "Internal Tools", description: "Suite of internal productivity tools", status: "archived", organization_id: 3 },
    ])
    .execute();

  // Seed tasks
  await db
    .insertInto("tasks")
    .values([
      { id: 1, title: "Design homepage mockup", description: "Create wireframes and high-fidelity mockups for the new homepage", status: "done", priority: "high", due_date: "2025-02-15", created_at: "2025-01-10T08:00:00Z", project_id: 1, assignee_id: 1 },
      { id: 2, title: "Implement responsive nav", description: "Build responsive navigation component with mobile hamburger menu", status: "in_progress", priority: "high", due_date: "2025-02-20", created_at: "2025-01-12T09:00:00Z", project_id: 1, assignee_id: 2 },
      { id: 3, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "todo", priority: "medium", due_date: "2025-03-01", created_at: "2025-01-15T10:00:00Z", project_id: 1, assignee_id: 2 },
      { id: 4, title: "Write unit tests for auth", description: "Add comprehensive unit tests for authentication module", status: "todo", priority: "medium", due_date: "2025-03-05", created_at: "2025-01-18T11:00:00Z", project_id: 1, assignee_id: 1 },
      { id: 5, title: "Optimize image loading", description: "Implement lazy loading and WebP conversion for all images", status: "todo", priority: "low", due_date: null, created_at: "2025-01-20T14:00:00Z", project_id: 1, assignee_id: null },
      { id: 6, title: "Set up React Native project", description: "Initialize React Native project with TypeScript and navigation", status: "done", priority: "urgent", due_date: "2025-01-30", created_at: "2025-01-05T08:00:00Z", project_id: 2, assignee_id: 1 },
      { id: 7, title: "Implement push notifications", description: "Add push notification support for iOS and Android", status: "in_progress", priority: "high", due_date: "2025-02-28", created_at: "2025-01-22T09:00:00Z", project_id: 2, assignee_id: 2 },
      { id: 8, title: "Build offline sync", description: "Implement offline data synchronization with conflict resolution", status: "todo", priority: "high", due_date: "2025-03-15", created_at: "2025-01-25T10:00:00Z", project_id: 2, assignee_id: 1 },
      { id: 9, title: "App store submission", description: "Prepare and submit app to Apple App Store and Google Play", status: "todo", priority: "medium", due_date: "2025-04-01", created_at: "2025-01-28T11:00:00Z", project_id: 2, assignee_id: null },
      { id: 10, title: "Design data models", description: "Define schemas for analytics events and user sessions", status: "in_progress", priority: "urgent", due_date: "2025-02-10", created_at: "2025-01-08T08:00:00Z", project_id: 3, assignee_id: 3 },
      { id: 11, title: "Set up Apache Kafka", description: "Deploy and configure Kafka cluster for event streaming", status: "todo", priority: "high", due_date: "2025-02-25", created_at: "2025-01-15T09:00:00Z", project_id: 3, assignee_id: 4 },
      { id: 12, title: "Build transformation layer", description: "Create data transformation functions for raw event processing", status: "todo", priority: "medium", due_date: "2025-03-10", created_at: "2025-01-20T10:00:00Z", project_id: 3, assignee_id: 3 },
      { id: 13, title: "Create monitoring dashboard", description: "Build real-time monitoring dashboard for pipeline health", status: "todo", priority: "low", due_date: null, created_at: "2025-01-25T11:00:00Z", project_id: 3, assignee_id: null },
      { id: 14, title: "Define API specifications", description: "Write OpenAPI specifications for all gateway endpoints", status: "done", priority: "urgent", due_date: "2025-01-20", created_at: "2025-01-02T08:00:00Z", project_id: 4, assignee_id: 3 },
      { id: 15, title: "Implement rate limiting", description: "Add configurable rate limiting per API key and endpoint", status: "in_progress", priority: "high", due_date: "2025-02-15", created_at: "2025-01-10T09:00:00Z", project_id: 4, assignee_id: 4 },
      { id: 16, title: "Set up request logging", description: "Implement structured logging for all API requests", status: "in_progress", priority: "medium", due_date: "2025-02-20", created_at: "2025-01-15T10:00:00Z", project_id: 4, assignee_id: 3 },
      { id: 17, title: "Add authentication middleware", description: "Build JWT validation and API key authentication middleware", status: "todo", priority: "high", due_date: "2025-03-01", created_at: "2025-01-20T11:00:00Z", project_id: 4, assignee_id: 4 },
      { id: 18, title: "Load testing", description: "Run load tests and optimize for 10k requests per second", status: "todo", priority: "medium", due_date: "2025-03-20", created_at: "2025-01-25T14:00:00Z", project_id: 4, assignee_id: null },
      { id: 19, title: "Document internal APIs", description: "Write comprehensive documentation for all internal tool APIs", status: "done", priority: "medium", due_date: "2025-01-15", created_at: "2024-12-20T08:00:00Z", project_id: 5, assignee_id: 5 },
      { id: 20, title: "Archive legacy endpoints", description: "Mark deprecated endpoints and plan migration timeline", status: "done", priority: "low", due_date: "2025-01-25", created_at: "2024-12-25T09:00:00Z", project_id: 5, assignee_id: 5 },
      { id: 21, title: "Security audit", description: "Conduct security audit of internal tools access controls", status: "todo", priority: "urgent", due_date: "2025-02-28", created_at: "2025-01-30T10:00:00Z", project_id: 1, assignee_id: 1 },
      { id: 22, title: "Performance profiling", description: "Profile and optimize slow database queries on dashboard", status: "todo", priority: "high", due_date: "2025-03-10", created_at: "2025-02-01T08:00:00Z", project_id: 2, assignee_id: 2 },
    ])
    .execute();

  // Reset sequences to be after the seeded IDs
  await sql`SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations))`.execute(db);
  await sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`.execute(db);
  await sql`SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects))`.execute(db);
  await sql`SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks))`.execute(db);

  console.log("Seed complete!");
  await db.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

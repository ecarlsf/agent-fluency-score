import "reflect-metadata";
import { DataSource } from "typeorm";
import { Organization } from "./entities/Organization";
import { User } from "./entities/User";
import { Project } from "./entities/Project";
import { Task } from "./entities/Task";

async function seed() {
  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/afs_orm_typeorm",
    entities: [Organization, User, Project, Task],
    synchronize: true,
    logging: false,
  });

  await ds.initialize();
  console.log("Connected to database");

  // Clear existing data (order matters for foreign keys)
  await ds.query("TRUNCATE tasks, users, projects, organizations RESTART IDENTITY CASCADE");

  // Seed organizations
  await ds.createQueryBuilder().insert().into(Organization).values([
    { id: 1, name: "Acme Corp", slug: "acme-corp" },
    { id: 2, name: "Globex Industries", slug: "globex-industries" },
    { id: 3, name: "Initech Solutions", slug: "initech-solutions" },
  ]).execute();
  console.log("Seeded organizations");

  // Seed users
  await ds.createQueryBuilder().insert().into(User).values([
    { id: 1, name: "Alice Johnson", email: "alice@acme.com", role: "admin", organizationId: 1 },
    { id: 2, name: "Bob Smith", email: "bob@acme.com", role: "member", organizationId: 1 },
    { id: 3, name: "Carol Williams", email: "carol@globex.com", role: "admin", organizationId: 2 },
    { id: 4, name: "Dave Brown", email: "dave@globex.com", role: "member", organizationId: 2 },
    { id: 5, name: "Eve Davis", email: "eve@initech.com", role: "viewer", organizationId: 3 },
  ]).execute();
  console.log("Seeded users");

  // Seed projects
  await ds.createQueryBuilder().insert().into(Project).values([
    { id: 1, name: "Website Redesign", description: "Complete overhaul of the company website with modern design", status: "active", organizationId: 1 },
    { id: 2, name: "Mobile App v2", description: "Second major version of the mobile application", status: "active", organizationId: 1 },
    { id: 3, name: "Data Pipeline", description: "Build ETL pipeline for analytics data processing", status: "planning", organizationId: 2 },
    { id: 4, name: "API Gateway", description: "Centralized API gateway for microservices architecture", status: "active", organizationId: 2 },
    { id: 5, name: "Internal Tools", description: "Suite of internal productivity tools", status: "archived", organizationId: 3 },
  ]).execute();
  console.log("Seeded projects");

  // Seed tasks
  await ds.createQueryBuilder().insert().into(Task).values([
    { id: 1, title: "Design homepage mockup", description: "Create wireframes and high-fidelity mockups for the new homepage", status: "done", priority: "high", dueDate: "2025-02-15", createdAt: "2025-01-10T08:00:00Z", projectId: 1, assigneeId: 1 },
    { id: 2, title: "Implement responsive nav", description: "Build responsive navigation component with mobile hamburger menu", status: "in_progress", priority: "high", dueDate: "2025-02-20", createdAt: "2025-01-12T09:00:00Z", projectId: 1, assigneeId: 2 },
    { id: 3, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "todo", priority: "medium", dueDate: "2025-03-01", createdAt: "2025-01-15T10:00:00Z", projectId: 1, assigneeId: 2 },
    { id: 4, title: "Write unit tests for auth", description: "Add comprehensive unit tests for authentication module", status: "todo", priority: "medium", dueDate: "2025-03-05", createdAt: "2025-01-18T11:00:00Z", projectId: 1, assigneeId: 1 },
    { id: 5, title: "Optimize image loading", description: "Implement lazy loading and WebP conversion for all images", status: "todo", priority: "low", dueDate: null, createdAt: "2025-01-20T14:00:00Z", projectId: 1, assigneeId: null },
    { id: 6, title: "Set up React Native project", description: "Initialize React Native project with TypeScript and navigation", status: "done", priority: "urgent", dueDate: "2025-01-30", createdAt: "2025-01-05T08:00:00Z", projectId: 2, assigneeId: 1 },
    { id: 7, title: "Implement push notifications", description: "Add push notification support for iOS and Android", status: "in_progress", priority: "high", dueDate: "2025-02-28", createdAt: "2025-01-22T09:00:00Z", projectId: 2, assigneeId: 2 },
    { id: 8, title: "Build offline sync", description: "Implement offline data synchronization with conflict resolution", status: "todo", priority: "high", dueDate: "2025-03-15", createdAt: "2025-01-25T10:00:00Z", projectId: 2, assigneeId: 1 },
    { id: 9, title: "App store submission", description: "Prepare and submit app to Apple App Store and Google Play", status: "todo", priority: "medium", dueDate: "2025-04-01", createdAt: "2025-01-28T11:00:00Z", projectId: 2, assigneeId: null },
    { id: 10, title: "Design data models", description: "Define schemas for analytics events and user sessions", status: "in_progress", priority: "urgent", dueDate: "2025-02-10", createdAt: "2025-01-08T08:00:00Z", projectId: 3, assigneeId: 3 },
    { id: 11, title: "Set up Apache Kafka", description: "Deploy and configure Kafka cluster for event streaming", status: "todo", priority: "high", dueDate: "2025-02-25", createdAt: "2025-01-15T09:00:00Z", projectId: 3, assigneeId: 4 },
    { id: 12, title: "Build transformation layer", description: "Create data transformation functions for raw event processing", status: "todo", priority: "medium", dueDate: "2025-03-10", createdAt: "2025-01-20T10:00:00Z", projectId: 3, assigneeId: 3 },
    { id: 13, title: "Create monitoring dashboard", description: "Build real-time monitoring dashboard for pipeline health", status: "todo", priority: "low", dueDate: null, createdAt: "2025-01-25T11:00:00Z", projectId: 3, assigneeId: null },
    { id: 14, title: "Define API specifications", description: "Write OpenAPI specifications for all gateway endpoints", status: "done", priority: "urgent", dueDate: "2025-01-20", createdAt: "2025-01-02T08:00:00Z", projectId: 4, assigneeId: 3 },
    { id: 15, title: "Implement rate limiting", description: "Add configurable rate limiting per API key and endpoint", status: "in_progress", priority: "high", dueDate: "2025-02-15", createdAt: "2025-01-10T09:00:00Z", projectId: 4, assigneeId: 4 },
    { id: 16, title: "Set up request logging", description: "Implement structured logging for all API requests", status: "in_progress", priority: "medium", dueDate: "2025-02-20", createdAt: "2025-01-15T10:00:00Z", projectId: 4, assigneeId: 3 },
    { id: 17, title: "Add authentication middleware", description: "Build JWT validation and API key authentication middleware", status: "todo", priority: "high", dueDate: "2025-03-01", createdAt: "2025-01-20T11:00:00Z", projectId: 4, assigneeId: 4 },
    { id: 18, title: "Load testing", description: "Run load tests and optimize for 10k requests per second", status: "todo", priority: "medium", dueDate: "2025-03-20", createdAt: "2025-01-25T14:00:00Z", projectId: 4, assigneeId: null },
    { id: 19, title: "Document internal APIs", description: "Write comprehensive documentation for all internal tool APIs", status: "done", priority: "medium", dueDate: "2025-01-15", createdAt: "2024-12-20T08:00:00Z", projectId: 5, assigneeId: 5 },
    { id: 20, title: "Archive legacy endpoints", description: "Mark deprecated endpoints and plan migration timeline", status: "done", priority: "low", dueDate: "2025-01-25", createdAt: "2024-12-25T09:00:00Z", projectId: 5, assigneeId: 5 },
    { id: 21, title: "Security audit", description: "Conduct security audit of internal tools access controls", status: "todo", priority: "urgent", dueDate: "2025-02-28", createdAt: "2025-01-30T10:00:00Z", projectId: 1, assigneeId: 1 },
    { id: 22, title: "Performance profiling", description: "Profile and optimize slow database queries on dashboard", status: "todo", priority: "high", dueDate: "2025-03-10", createdAt: "2025-02-01T08:00:00Z", projectId: 2, assigneeId: 2 },
  ]).execute();
  console.log("Seeded tasks");

  // Reset sequences to avoid ID conflicts on future inserts
  await ds.query(`SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations))`);
  await ds.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  await ds.query(`SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects))`);
  await ds.query(`SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks))`);
  console.log("Reset sequences");

  await ds.destroy();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Organizations
  await Promise.all([
    prisma.organization.create({ data: { id: 1, name: "Acme Corp", slug: "acme-corp" } }),
    prisma.organization.create({ data: { id: 2, name: "Globex Industries", slug: "globex-industries" } }),
    prisma.organization.create({ data: { id: 3, name: "Initech Solutions", slug: "initech-solutions" } }),
  ]);

  // Users
  await Promise.all([
    prisma.user.create({ data: { id: 1, name: "Alice Johnson", email: "alice@acme.com", role: "admin", organizationId: 1 } }),
    prisma.user.create({ data: { id: 2, name: "Bob Smith", email: "bob@acme.com", role: "member", organizationId: 1 } }),
    prisma.user.create({ data: { id: 3, name: "Carol Williams", email: "carol@globex.com", role: "admin", organizationId: 2 } }),
    prisma.user.create({ data: { id: 4, name: "Dave Brown", email: "dave@globex.com", role: "member", organizationId: 2 } }),
    prisma.user.create({ data: { id: 5, name: "Eve Davis", email: "eve@initech.com", role: "viewer", organizationId: 3 } }),
  ]);

  // Projects
  await Promise.all([
    prisma.project.create({ data: { id: 1, name: "Website Redesign", description: "Complete overhaul of the company website with modern design", status: "active", organizationId: 1 } }),
    prisma.project.create({ data: { id: 2, name: "Mobile App v2", description: "Second major version of the mobile application", status: "active", organizationId: 1 } }),
    prisma.project.create({ data: { id: 3, name: "Data Pipeline", description: "Build ETL pipeline for analytics data processing", status: "planning", organizationId: 2 } }),
    prisma.project.create({ data: { id: 4, name: "API Gateway", description: "Centralized API gateway for microservices architecture", status: "active", organizationId: 2 } }),
    prisma.project.create({ data: { id: 5, name: "Internal Tools", description: "Suite of internal productivity tools", status: "archived", organizationId: 3 } }),
  ]);

  // Tasks
  await Promise.all([
    prisma.task.create({ data: { id: 1, title: "Design homepage mockup", description: "Create wireframes and high-fidelity mockups for the new homepage", status: "done", priority: "high", dueDate: "2025-02-15", createdAt: "2025-01-10T08:00:00Z", projectId: 1, assigneeId: 1 } }),
    prisma.task.create({ data: { id: 2, title: "Implement responsive nav", description: "Build responsive navigation component with mobile hamburger menu", status: "in_progress", priority: "high", dueDate: "2025-02-20", createdAt: "2025-01-12T09:00:00Z", projectId: 1, assigneeId: 2 } }),
    prisma.task.create({ data: { id: 3, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "todo", priority: "medium", dueDate: "2025-03-01", createdAt: "2025-01-15T10:00:00Z", projectId: 1, assigneeId: 2 } }),
    prisma.task.create({ data: { id: 4, title: "Write unit tests for auth", description: "Add comprehensive unit tests for authentication module", status: "todo", priority: "medium", dueDate: "2025-03-05", createdAt: "2025-01-18T11:00:00Z", projectId: 1, assigneeId: 1 } }),
    prisma.task.create({ data: { id: 5, title: "Optimize image loading", description: "Implement lazy loading and WebP conversion for all images", status: "todo", priority: "low", dueDate: null, createdAt: "2025-01-20T14:00:00Z", projectId: 1, assigneeId: null } }),
    prisma.task.create({ data: { id: 6, title: "Set up React Native project", description: "Initialize React Native project with TypeScript and navigation", status: "done", priority: "urgent", dueDate: "2025-01-30", createdAt: "2025-01-05T08:00:00Z", projectId: 2, assigneeId: 1 } }),
    prisma.task.create({ data: { id: 7, title: "Implement push notifications", description: "Add push notification support for iOS and Android", status: "in_progress", priority: "high", dueDate: "2025-02-28", createdAt: "2025-01-22T09:00:00Z", projectId: 2, assigneeId: 2 } }),
    prisma.task.create({ data: { id: 8, title: "Build offline sync", description: "Implement offline data synchronization with conflict resolution", status: "todo", priority: "high", dueDate: "2025-03-15", createdAt: "2025-01-25T10:00:00Z", projectId: 2, assigneeId: 1 } }),
    prisma.task.create({ data: { id: 9, title: "App store submission", description: "Prepare and submit app to Apple App Store and Google Play", status: "todo", priority: "medium", dueDate: "2025-04-01", createdAt: "2025-01-28T11:00:00Z", projectId: 2, assigneeId: null } }),
    prisma.task.create({ data: { id: 10, title: "Design data models", description: "Define schemas for analytics events and user sessions", status: "in_progress", priority: "urgent", dueDate: "2025-02-10", createdAt: "2025-01-08T08:00:00Z", projectId: 3, assigneeId: 3 } }),
    prisma.task.create({ data: { id: 11, title: "Set up Apache Kafka", description: "Deploy and configure Kafka cluster for event streaming", status: "todo", priority: "high", dueDate: "2025-02-25", createdAt: "2025-01-15T09:00:00Z", projectId: 3, assigneeId: 4 } }),
    prisma.task.create({ data: { id: 12, title: "Build transformation layer", description: "Create data transformation functions for raw event processing", status: "todo", priority: "medium", dueDate: "2025-03-10", createdAt: "2025-01-20T10:00:00Z", projectId: 3, assigneeId: 3 } }),
    prisma.task.create({ data: { id: 13, title: "Create monitoring dashboard", description: "Build real-time monitoring dashboard for pipeline health", status: "todo", priority: "low", dueDate: null, createdAt: "2025-01-25T11:00:00Z", projectId: 3, assigneeId: null } }),
    prisma.task.create({ data: { id: 14, title: "Define API specifications", description: "Write OpenAPI specifications for all gateway endpoints", status: "done", priority: "urgent", dueDate: "2025-01-20", createdAt: "2025-01-02T08:00:00Z", projectId: 4, assigneeId: 3 } }),
    prisma.task.create({ data: { id: 15, title: "Implement rate limiting", description: "Add configurable rate limiting per API key and endpoint", status: "in_progress", priority: "high", dueDate: "2025-02-15", createdAt: "2025-01-10T09:00:00Z", projectId: 4, assigneeId: 4 } }),
    prisma.task.create({ data: { id: 16, title: "Set up request logging", description: "Implement structured logging for all API requests", status: "in_progress", priority: "medium", dueDate: "2025-02-20", createdAt: "2025-01-15T10:00:00Z", projectId: 4, assigneeId: 3 } }),
    prisma.task.create({ data: { id: 17, title: "Add authentication middleware", description: "Build JWT validation and API key authentication middleware", status: "todo", priority: "high", dueDate: "2025-03-01", createdAt: "2025-01-20T11:00:00Z", projectId: 4, assigneeId: 4 } }),
    prisma.task.create({ data: { id: 18, title: "Load testing", description: "Run load tests and optimize for 10k requests per second", status: "todo", priority: "medium", dueDate: "2025-03-20", createdAt: "2025-01-25T14:00:00Z", projectId: 4, assigneeId: null } }),
    prisma.task.create({ data: { id: 19, title: "Document internal APIs", description: "Write comprehensive documentation for all internal tool APIs", status: "done", priority: "medium", dueDate: "2025-01-15", createdAt: "2024-12-20T08:00:00Z", projectId: 5, assigneeId: 5 } }),
    prisma.task.create({ data: { id: 20, title: "Archive legacy endpoints", description: "Mark deprecated endpoints and plan migration timeline", status: "done", priority: "low", dueDate: "2025-01-25", createdAt: "2024-12-25T09:00:00Z", projectId: 5, assigneeId: 5 } }),
    prisma.task.create({ data: { id: 21, title: "Security audit", description: "Conduct security audit of internal tools access controls", status: "todo", priority: "urgent", dueDate: "2025-02-28", createdAt: "2025-01-30T10:00:00Z", projectId: 1, assigneeId: 1 } }),
    prisma.task.create({ data: { id: 22, title: "Performance profiling", description: "Profile and optimize slow database queries on dashboard", status: "todo", priority: "high", dueDate: "2025-03-10", createdAt: "2025-02-01T08:00:00Z", projectId: 2, assigneeId: 2 } }),
  ]);

  // Reset sequences to be after the max id
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Organization"', 'id'), (SELECT MAX(id) FROM "Organization"))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User"))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Project"', 'id'), (SELECT MAX(id) FROM "Project"))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Task"', 'id'), (SELECT MAX(id) FROM "Task"))`);

  console.log("Seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

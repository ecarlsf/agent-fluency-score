// ---------------------------------------------------------------------------
// Types — these mirror what the ORM schema should look like
// ---------------------------------------------------------------------------

export interface Organization {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member" | "viewer";
  organizationId: number;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: "active" | "archived" | "planning";
  organizationId: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  projectId: number;
  assigneeId: number | null;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const organizations: Organization[] = [
  { id: 1, name: "Acme Corp", slug: "acme-corp" },
  { id: 2, name: "Globex Industries", slug: "globex-industries" },
  { id: 3, name: "Initech Solutions", slug: "initech-solutions" },
];

export const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@acme.com", role: "admin", organizationId: 1 },
  { id: 2, name: "Bob Smith", email: "bob@acme.com", role: "member", organizationId: 1 },
  { id: 3, name: "Carol Williams", email: "carol@globex.com", role: "admin", organizationId: 2 },
  { id: 4, name: "Dave Brown", email: "dave@globex.com", role: "member", organizationId: 2 },
  { id: 5, name: "Eve Davis", email: "eve@initech.com", role: "viewer", organizationId: 3 },
];

export const projects: Project[] = [
  { id: 1, name: "Website Redesign", description: "Complete overhaul of the company website with modern design", status: "active", organizationId: 1 },
  { id: 2, name: "Mobile App v2", description: "Second major version of the mobile application", status: "active", organizationId: 1 },
  { id: 3, name: "Data Pipeline", description: "Build ETL pipeline for analytics data processing", status: "planning", organizationId: 2 },
  { id: 4, name: "API Gateway", description: "Centralized API gateway for microservices architecture", status: "active", organizationId: 2 },
  { id: 5, name: "Internal Tools", description: "Suite of internal productivity tools", status: "archived", organizationId: 3 },
];

export const tasks: Task[] = [
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
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getOrganization(id: number): Organization | undefined {
  return organizations.find((o) => o.id === id);
}

export function getUser(id: number): User | undefined {
  return users.find((u) => u.id === id);
}

export function getProject(id: number): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getTasksForProject(projectId: number): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function getTaskCountForProject(projectId: number): number {
  return tasks.filter((t) => t.projectId === projectId).length;
}

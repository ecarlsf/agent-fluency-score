import { CategoryDefinition } from "../types.js";

const orm: CategoryDefinition = {
  name: "orm",
  starterAppPath: "orm-starter-app",
  tools: ["prisma", "drizzle", "kysely", "typeorm"],
  tasks: [
    {
      id: 1,
      tier: "Basic Setup",
      description: "Install and configure the ORM with PostgreSQL connection",
      prompt:
        "Set up {{tool}} in this Next.js project management app. Install the package, configure the database connection using the DATABASE_URL from .env, and define schemas/models for the existing data types in src/lib/mock-data.ts (Organization, User, Project, Task). Replace the mock data imports with real database queries. The app should build and display the same data from the database. The app also has JSON API routes under src/app/api/ that use mock data — these should also return data from the database.",
    },
    {
      id: 2,
      tier: "Core CRUD",
      description: "Implement working CRUD operations for tasks",
      prompt:
        "Make the create-task form at /projects/[id]/tasks/new fully functional. When submitted, it should insert a real task into the database using {{tool}} and redirect back to the project detail page showing the new task. Also make the dashboard stats (/dashboard) reflect real database counts. Also update the API route handlers under src/app/api/ to use real database queries instead of mock data.",
    },
    {
      id: 3,
      tier: "Complex Queries",
      description: "Implement filtering and pagination with query parameters",
      prompt:
        "Make the project detail page (/projects/[id]) support filtering by status and assignee via query parameters (?status=todo&assignee=1). Add working filter dropdowns that update the URL. Add pagination (10 tasks per page) with Next/Previous controls. Also make the GET /api/projects/[id]/tasks endpoint support the same ?status=, ?assignee=, ?page=, and ?limit= query parameters.",
    },
    {
      id: 4,
      tier: "Transactions",
      description: "Implement cross-project task moves with transactional integrity",
      prompt:
        "Add the ability to move a task from one project to another. On the project detail page, add a 'Move' control for each task that lets the user select a different project and move the task there. This must use a database transaction to ensure the task count stays consistent across both projects. Implement the POST /api/projects/[id]/tasks/[taskId]/move endpoint (currently returns 501) to perform the transactional move.",
    },
    {
      id: 5,
      tier: "Advanced Patterns",
      description: "Implement soft deletes with archive/restore functionality",
      prompt:
        "Add soft-delete functionality to tasks. Instead of permanently deleting tasks, add a 'Delete' or 'Archive' button that marks them as deleted (soft delete). Archived tasks should appear at /projects/[id]/archived with a 'Restore' button. The main task list should only show non-deleted tasks. Implement the POST /api/projects/[id]/tasks/[taskId]/archive and /restore endpoints (currently return 501).",
    },
  ],
};

export default orm;

import { db } from "./db";
import type { Organization, User, Project, Task } from "./mock-data";

// ---------------------------------------------------------------------------
// Helper to map snake_case DB rows to camelCase app types
// ---------------------------------------------------------------------------

function mapUser(row: { id: number; name: string; email: string; role: string; organization_id: number }): User {
  return { id: row.id, name: row.name, email: row.email, role: row.role as User["role"], organizationId: row.organization_id };
}

function mapProject(row: { id: number; name: string; description: string; status: string; organization_id: number }): Project {
  return { id: row.id, name: row.name, description: row.description, status: row.status as Project["status"], organizationId: row.organization_id };
}

function mapTask(row: { id: number; title: string; description: string; status: string; priority: string; due_date: string | null; created_at: string; project_id: number; assignee_id: number | null; archived_at: string | null }): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    dueDate: row.due_date,
    createdAt: row.created_at,
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    archivedAt: row.archived_at,
  };
}

// ---------------------------------------------------------------------------
// Query functions — async replacements for the old mock-data helpers
// ---------------------------------------------------------------------------

export async function getAllOrganizations(): Promise<Organization[]> {
  return db.selectFrom("organizations").selectAll().execute();
}

export async function getOrganization(id: number): Promise<Organization | undefined> {
  return db.selectFrom("organizations").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await db.selectFrom("users").selectAll().execute();
  return rows.map(mapUser);
}

export async function getUser(id: number): Promise<User | undefined> {
  const row = await db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();
  return row ? mapUser(row) : undefined;
}

export async function getAllProjects(): Promise<Project[]> {
  const rows = await db.selectFrom("projects").selectAll().execute();
  return rows.map(mapProject);
}

export async function getProject(id: number): Promise<Project | undefined> {
  const row = await db.selectFrom("projects").selectAll().where("id", "=", id).executeTakeFirst();
  return row ? mapProject(row) : undefined;
}

export async function getTasksForProject(projectId: number): Promise<Task[]> {
  const rows = await db.selectFrom("tasks").selectAll()
    .where("project_id", "=", projectId)
    .where("archived_at", "is", null)
    .execute();
  return rows.map(mapTask);
}

export async function getTaskCountForProject(projectId: number): Promise<number> {
  const result = await db
    .selectFrom("tasks")
    .select(db.fn.countAll<number>().as("count"))
    .where("project_id", "=", projectId)
    .where("archived_at", "is", null)
    .executeTakeFirstOrThrow();
  return Number(result.count);
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = await db.selectFrom("tasks").selectAll()
    .where("archived_at", "is", null)
    .execute();
  return rows.map(mapTask);
}

export async function getDashboardStats() {
  const [projectCount, taskCounts, userCount] = await Promise.all([
    db.selectFrom("projects").select(db.fn.countAll<number>().as("count")).executeTakeFirstOrThrow(),
    db.selectFrom("tasks")
      .where("archived_at", "is", null)
      .select([
        db.fn.countAll<number>().as("total"),
        db.fn.count<number>("id").filterWhere("status", "=", "todo").as("todo"),
        db.fn.count<number>("id").filterWhere("status", "=", "in_progress").as("in_progress"),
        db.fn.count<number>("id").filterWhere("status", "=", "done").as("done"),
      ])
      .executeTakeFirstOrThrow(),
    db.selectFrom("users").select(db.fn.countAll<number>().as("count")).executeTakeFirstOrThrow(),
  ]);

  return {
    totalProjects: Number(projectCount.count),
    totalTasks: Number(taskCounts.total),
    todoCount: Number(taskCounts.todo),
    inProgressCount: Number(taskCounts.in_progress),
    doneCount: Number(taskCounts.done),
    totalUsers: Number(userCount.count),
  };
}

export async function getProjectsWithTaskCounts(): Promise<(Project & { taskCount: number })[]> {
  const rows = await db
    .selectFrom("projects")
    .select([
      "projects.id",
      "projects.name",
      "projects.description",
      "projects.status",
      "projects.organization_id",
      (eb) =>
        eb
          .selectFrom("tasks")
          .select(eb.fn.countAll<number>().as("count"))
          .whereRef("tasks.project_id", "=", "projects.id")
          .where("tasks.archived_at", "is", null)
          .as("task_count"),
    ])
    .execute();

  return rows.map((row) => ({
    ...mapProject(row),
    taskCount: Number(row.task_count ?? 0),
  }));
}

export async function getFilteredTasksForProject(
  projectId: number,
  filters: {
    status?: string;
    assigneeId?: number;
    page?: number;
    limit?: number;
  }
): Promise<{ tasks: Task[]; total: number }> {
  let query = db.selectFrom("tasks")
    .where("project_id", "=", projectId)
    .where("archived_at", "is", null);

  if (filters.status) {
    query = query.where("status", "=", filters.status as Task["status"]);
  }
  if (filters.assigneeId !== undefined) {
    query = query.where("assignee_id", "=", filters.assigneeId);
  }

  let dataQuery = query.selectAll();
  if (filters.limit !== undefined) {
    const page = filters.page ?? 1;
    const offset = (page - 1) * filters.limit;
    dataQuery = dataQuery.limit(filters.limit).offset(offset);
  }

  const [rows, countResult] = await Promise.all([
    dataQuery.execute(),
    query
      .select(db.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow(),
  ]);

  return {
    tasks: rows.map(mapTask),
    total: Number(countResult.count),
  };
}

export async function moveTask(
  taskId: number,
  fromProjectId: number,
  toProjectId: number
): Promise<Task> {
  return db.transaction().execute(async (trx) => {
    const task = await trx
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", taskId)
      .where("project_id", "=", fromProjectId)
      .executeTakeFirst();

    if (!task) {
      throw new Error("Task not found in source project");
    }

    const destProject = await trx
      .selectFrom("projects")
      .select("id")
      .where("id", "=", toProjectId)
      .executeTakeFirst();

    if (!destProject) {
      throw new Error("Destination project not found");
    }

    const updated = await trx
      .updateTable("tasks")
      .set({ project_id: toProjectId })
      .where("id", "=", taskId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return mapTask(updated);
  });
}

export async function createTask(data: {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
}): Promise<Task> {
  const row = await db
    .insertInto("tasks")
    .values({
      title: data.title,
      description: data.description,
      status: data.status as Task["status"],
      priority: data.priority as Task["priority"],
      due_date: data.dueDate,
      created_at: new Date().toISOString(),
      project_id: data.projectId,
      assignee_id: data.assigneeId,
      archived_at: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return mapTask(row);
}

// ---------------------------------------------------------------------------
// Archive / Restore
// ---------------------------------------------------------------------------

export async function archiveTask(taskId: number, projectId: number): Promise<Task> {
  const row = await db
    .updateTable("tasks")
    .set({ archived_at: new Date().toISOString() })
    .where("id", "=", taskId)
    .where("project_id", "=", projectId)
    .where("archived_at", "is", null)
    .returningAll()
    .executeTakeFirst();

  if (!row) {
    throw new Error("Task not found or already archived");
  }

  return mapTask(row);
}

export async function restoreTask(taskId: number, projectId: number): Promise<Task> {
  const row = await db
    .updateTable("tasks")
    .set({ archived_at: null })
    .where("id", "=", taskId)
    .where("project_id", "=", projectId)
    .where("archived_at", "is not", null)
    .returningAll()
    .executeTakeFirst();

  if (!row) {
    throw new Error("Task not found or not archived");
  }

  return mapTask(row);
}

export async function getArchivedTasksForProject(projectId: number): Promise<Task[]> {
  const rows = await db
    .selectFrom("tasks")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("archived_at", "is not", null)
    .execute();
  return rows.map(mapTask);
}

import { eq, and, isNull, isNotNull, count, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  organizations,
  users,
  projects,
  tasks,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export async function getOrganizations() {
  return db.select().from(organizations);
}

export async function getOrganization(id: number) {
  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id));
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUsers() {
  return db.select().from(users);
}

export async function getUser(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects() {
  return db.select().from(projects);
}

export async function getProject(id: number) {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));
  return rows[0] ?? null;
}

export async function getProjectsWithTaskCount() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      organizationId: projects.organizationId,
      taskCount: count(tasks.id),
    })
    .from(projects)
    .leftJoin(
      tasks,
      and(eq(projects.id, tasks.projectId), isNull(tasks.archivedAt))
    )
    .groupBy(projects.id);
  return rows;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasks() {
  return db.select().from(tasks);
}

export async function getTasksForProject(projectId: number) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
}

export async function getFilteredTasksForProject(
  projectId: number,
  filters: {
    status?: string;
    assignee?: string;
    page?: number;
    limit?: number;
  }
) {
  const conditions: SQL[] = [eq(tasks.projectId, projectId), isNull(tasks.archivedAt)];

  if (filters.status) {
    conditions.push(
      eq(tasks.status, filters.status as "todo" | "in_progress" | "done")
    );
  }
  if (filters.assignee) {
    conditions.push(eq(tasks.assigneeId, parseInt(filters.assignee, 10)));
  }

  const where = and(...conditions)!;
  const paginate = filters.page != null || filters.limit != null;
  const limit = filters.limit ?? 10;
  const page = filters.page ?? 1;
  const offset = (page - 1) * limit;

  let query = db.select().from(tasks).where(where);
  if (paginate) {
    query = query.limit(limit).offset(offset) as typeof query;
  }

  const [rows, [totalRow]] = await Promise.all([
    query,
    db
      .select({ value: count() })
      .from(tasks)
      .where(where),
  ]);

  return { tasks: rows, total: totalRow.value };
}

export async function getTaskCountForProject(projectId: number) {
  const rows = await db
    .select({ value: count() })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.archivedAt)));
  return rows[0]?.value ?? 0;
}

export async function createTask(data: {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
}) {
  const rows = await db
    .insert(tasks)
    .values({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    })
    .returning();
  return rows[0];
}

// ---------------------------------------------------------------------------
// Archive / Restore
// ---------------------------------------------------------------------------

export async function archiveTask(taskId: number, projectId: number) {
  const rows = await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, projectId),
        isNull(tasks.archivedAt)
      )
    )
    .returning();
  return rows[0] ?? null;
}

export async function restoreTask(taskId: number, projectId: number) {
  const rows = await db
    .update(tasks)
    .set({ archivedAt: null })
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, projectId),
        isNotNull(tasks.archivedAt)
      )
    )
    .returning();
  return rows[0] ?? null;
}

export async function getArchivedTasksForProject(projectId: number) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNotNull(tasks.archivedAt)));
}

// ---------------------------------------------------------------------------
// Move task (transactional)
// ---------------------------------------------------------------------------

export async function moveTask(taskId: number, fromProjectId: number, toProjectId: number) {
  return db.transaction(async (tx) => {
    // Verify the task exists and belongs to the source project
    const [task] = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, fromProjectId)));
    if (!task) return null;

    // Verify destination project exists
    const [dest] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, toProjectId));
    if (!dest) return null;

    // Move the task
    const [updated] = await tx
      .update(tasks)
      .set({ projectId: toProjectId })
      .where(eq(tasks.id, taskId))
      .returning();

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const [[projectCount], [taskStats], [userCount]] = await Promise.all([
    db.select({ value: count() }).from(projects),
    db
      .select({
        total: count(),
        todo: count(sql`CASE WHEN ${tasks.status} = 'todo' THEN 1 END`),
        inProgress: count(
          sql`CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END`
        ),
        done: count(sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`),
      })
      .from(tasks)
      .where(isNull(tasks.archivedAt)),
    db.select({ value: count() }).from(users),
  ]);

  return {
    totalProjects: projectCount.value,
    totalTasks: taskStats.total,
    todoCount: taskStats.todo,
    inProgressCount: taskStats.inProgress,
    doneCount: taskStats.done,
    totalUsers: userCount.value,
  };
}

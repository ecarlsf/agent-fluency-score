// ---------------------------------------------------------------------------
// Re-export entity types so existing imports continue to resolve
// ---------------------------------------------------------------------------

export type { Organization } from "./entities/Organization";
export type { User } from "./entities/User";
export type { Project } from "./entities/Project";
export type { Task } from "./entities/Task";

// ---------------------------------------------------------------------------
// Database query helpers — drop-in replacements for the old mock arrays
// ---------------------------------------------------------------------------

import { IsNull, Not } from "typeorm";
import { getRepo } from "./data-source";
import type { Organization } from "./entities/Organization";
import type { User } from "./entities/User";
import type { Project } from "./entities/Project";
import type { Task } from "./entities/Task";

export async function getOrganizations() {
  const repo = await getRepo<Organization>("organizations");
  return repo.find();
}

export async function getUsers() {
  const repo = await getRepo<User>("users");
  return repo.find();
}

export async function getProjects() {
  const repo = await getRepo<Project>("projects");
  return repo.find();
}

export async function getTasks() {
  const repo = await getRepo<Task>("tasks");
  return repo.find({ where: { archivedAt: IsNull() } });
}

export async function getOrganization(id: number) {
  const repo = await getRepo<Organization>("organizations");
  return repo.findOneBy({ id });
}

export async function getUser(id: number) {
  const repo = await getRepo<User>("users");
  return repo.findOneBy({ id });
}

export async function getProject(id: number) {
  const repo = await getRepo<Project>("projects");
  return repo.findOneBy({ id });
}

export async function getTasksForProject(projectId: number) {
  const repo = await getRepo<Task>("tasks");
  return repo.find({ where: { projectId, archivedAt: IsNull() } });
}

export async function getTaskCountForProject(projectId: number) {
  const repo = await getRepo<Task>("tasks");
  return repo.count({ where: { projectId, archivedAt: IsNull() } });
}

export async function moveTask(taskId: number, fromProjectId: number, toProjectId: number) {
  const ds = await (await import("./data-source")).getDb();
  await ds.transaction(async (manager) => {
    const taskMeta = ds.entityMetadatas.find((m) => m.tableName === "tasks");
    const projectMeta = ds.entityMetadatas.find((m) => m.tableName === "projects");
    if (!taskMeta || !projectMeta) throw new Error("Entity metadata not found");

    const taskRepo = manager.getRepository<Task>(taskMeta.target);
    const projectRepo = manager.getRepository<Project>(projectMeta.target);

    const task = await taskRepo.findOneBy({ id: taskId, projectId: fromProjectId });
    if (!task) throw new Error("Task not found in source project");

    const targetProject = await projectRepo.findOneBy({ id: toProjectId });
    if (!targetProject) throw new Error("Target project not found");

    task.projectId = toProjectId;
    await taskRepo.save(task);
  });
}

export async function archiveTask(taskId: number, projectId: number) {
  const repo = await getRepo<Task>("tasks");
  const task = await repo.findOneBy({ id: taskId, projectId });
  if (!task) throw new Error("Task not found");
  task.archivedAt = new Date().toISOString();
  await repo.save(task);
  return task;
}

export async function restoreTask(taskId: number, projectId: number) {
  const repo = await getRepo<Task>("tasks");
  const task = await repo.findOneBy({ id: taskId, projectId });
  if (!task) throw new Error("Task not found");
  task.archivedAt = null;
  await repo.save(task);
  return task;
}

export async function getArchivedTasksForProject(projectId: number) {
  const { getDb } = await import("./data-source");
  const ds = await getDb();
  const meta = ds.entityMetadatas.find((m) => m.tableName === "tasks");
  if (!meta) throw new Error("Entity metadata not found");
  return ds.getRepository<Task>(meta.target).find({
    where: { projectId, archivedAt: Not(IsNull()) },
    order: { id: "ASC" },
  });
}

export async function getFilteredTasks(
  projectId: number,
  filters: { status?: string; assigneeId?: number; page?: number; limit?: number }
) {
  const repo = await getRepo<Task>("tasks");
  const where: Record<string, unknown> = { projectId, archivedAt: IsNull() };
  if (filters.status) where.status = filters.status;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  const limit = filters.limit;
  const page = filters.page ?? 1;

  const [tasks, total] = await repo.findAndCount({
    where,
    ...(limit ? { take: limit, skip: (page - 1) * limit } : {}),
    order: { id: "ASC" },
  });

  return {
    tasks,
    total,
    page,
    limit: limit ?? total,
    totalPages: limit ? Math.ceil(total / limit) : 1,
  };
}

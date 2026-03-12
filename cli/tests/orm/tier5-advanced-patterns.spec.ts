import { test, expect } from "@playwright/test";
import { getDbClient, findTable, findColumn } from "../helpers/db.js";

test.describe("Tier 5 — Advanced Patterns", () => {
  // Helper to get a valid project and task
  async function getProjectAndTask(request: any) {
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const projectId = projects[0].id ?? projects[0].ID;

    const tasksRes = await request.get(`/api/projects/${projectId}/tasks`);
    const tasksData = await tasksRes.json();
    const tasks =
      tasksData.tasks ?? tasksData.data ?? tasksData.items ?? tasksData;
    const task = tasks[0];
    const taskId = task.id ?? task.ID;

    return { projectId, taskId };
  }

  test("archive endpoint implemented", async ({ request }) => {
    const { projectId, taskId } = await getProjectAndTask(request);
    const res = await request.post(
      `/api/projects/${projectId}/tasks/${taskId}/archive`
    );
    expect(res.status()).not.toBe(501);
  });

  test("archived task gone from main list", async ({ request }) => {
    const { projectId, taskId } = await getProjectAndTask(request);

    // Archive the task
    await request.post(
      `/api/projects/${projectId}/tasks/${taskId}/archive`
    );

    // Verify task is not in main listing
    const tasksRes = await request.get(`/api/projects/${projectId}/tasks`);
    const tasksData = await tasksRes.json();
    const tasks =
      tasksData.tasks ?? tasksData.data ?? tasksData.items ?? tasksData;
    const found = (Array.isArray(tasks) ? tasks : []).some(
      (t: Record<string, unknown>) => (t.id ?? t.ID) === taskId
    );
    expect(found).toBe(false);
  });

  test("soft-delete column exists in DB", async () => {
    const db = await getDbClient();
    try {
      const table = await findTable(db, ["Task", "Tasks", "task", "tasks"]);
      expect(table).not.toBeNull();

      // Try to find any soft-delete column variant
      let softDeleteFound = false;
      try {
        await findColumn(db, table!, [
          "deleted_at",
          "deletedAt",
          "DeletedAt",
          "is_deleted",
          "isDeleted",
          "archived",
          "archived_at",
          "archivedAt",
        ]);
        softDeleteFound = true;
      } catch {
        softDeleteFound = false;
      }
      expect(softDeleteFound).toBe(true);
    } finally {
      await db.end();
    }
  });

  test("restore brings task back", async ({ request }) => {
    const { projectId, taskId } = await getProjectAndTask(request);

    // Archive then restore
    await request.post(
      `/api/projects/${projectId}/tasks/${taskId}/archive`
    );
    const restoreRes = await request.post(
      `/api/projects/${projectId}/tasks/${taskId}/restore`
    );
    expect(restoreRes.status()).toBeLessThan(500);

    // Verify task reappears in main listing
    const tasksRes = await request.get(`/api/projects/${projectId}/tasks`);
    const tasksData = await tasksRes.json();
    const tasks =
      tasksData.tasks ?? tasksData.data ?? tasksData.items ?? tasksData;
    const found = (Array.isArray(tasks) ? tasks : []).some(
      (t: Record<string, unknown>) => (t.id ?? t.ID) === taskId
    );
    expect(found).toBe(true);
  });

  test("archived page renders", async ({ request }) => {
    const res = await request.get("/projects/1/archived");
    expect(res.status()).toBeLessThan(500);
  });
});

import { test, expect } from "@playwright/test";
import { getDbClient, findTable, findColumn } from "../helpers/db.js";

test.describe("Tier 4 — Transactions", () => {
  // Helper to get a valid project ID and a task in it
  async function getProjectAndTask(request: any) {
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const sourceProject = projects[0];
    const targetProject = projects[1];
    const sourceId = sourceProject.id ?? sourceProject.ID;
    const targetId = targetProject.id ?? targetProject.ID;

    const tasksRes = await request.get(`/api/projects/${sourceId}/tasks`);
    const tasksData = await tasksRes.json();
    const tasks = tasksData.tasks ?? tasksData.data ?? tasksData.items ?? tasksData;
    const task = tasks[0];
    const taskId = task.id ?? task.ID;

    return { sourceId, targetId, taskId };
  }

  test("move endpoint implemented", async ({ request }) => {
    const { sourceId, taskId, targetId } = await getProjectAndTask(request);
    const res = await request.post(
      `/api/projects/${sourceId}/tasks/${taskId}/move`,
      { data: { targetProjectId: targetId } }
    );
    expect(res.status()).not.toBe(501);
  });

  test("move changes project_id in DB", async ({ request }) => {
    const { sourceId, targetId, taskId } = await getProjectAndTask(request);

    await request.post(
      `/api/projects/${sourceId}/tasks/${taskId}/move`,
      { data: { targetProjectId: targetId } }
    );

    const db = await getDbClient();
    try {
      const table = await findTable(db, ["Task", "Tasks", "task", "tasks"]);
      expect(table).not.toBeNull();
      const projectCol = await findColumn(db, table!, [
        "projectId",
        "project_id",
        "ProjectId",
      ]);
      const res = await db.query(
        `SELECT "${projectCol}" FROM "${table}" WHERE id = $1`,
        [taskId]
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0][projectCol]).toBe(targetId);
    } finally {
      await db.end();
    }
  });

  test("move reflected in both API lists", async ({ request }) => {
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const sourceId = projects[0].id ?? projects[0].ID;
    const targetId = projects[1].id ?? projects[1].ID;

    // Get initial counts
    const sourceBefore = await request.get(`/api/projects/${sourceId}/tasks`);
    const sourceDataBefore = await sourceBefore.json();
    const sourceTasksBefore =
      sourceDataBefore.tasks ?? sourceDataBefore.data ?? sourceDataBefore.items ?? sourceDataBefore;
    const sourceCountBefore = Array.isArray(sourceTasksBefore)
      ? sourceTasksBefore.length
      : 0;

    const targetBefore = await request.get(`/api/projects/${targetId}/tasks`);
    const targetDataBefore = await targetBefore.json();
    const targetTasksBefore =
      targetDataBefore.tasks ?? targetDataBefore.data ?? targetDataBefore.items ?? targetDataBefore;
    const targetCountBefore = Array.isArray(targetTasksBefore)
      ? targetTasksBefore.length
      : 0;

    // Move first task from source to target
    if (sourceCountBefore > 0) {
      const taskId = sourceTasksBefore[0].id ?? sourceTasksBefore[0].ID;
      await request.post(
        `/api/projects/${sourceId}/tasks/${taskId}/move`,
        { data: { targetProjectId: targetId } }
      );

      // Verify counts changed
      const sourceAfter = await request.get(`/api/projects/${sourceId}/tasks`);
      const sourceDataAfter = await sourceAfter.json();
      const sourceTasksAfter =
        sourceDataAfter.tasks ?? sourceDataAfter.data ?? sourceDataAfter.items ?? sourceDataAfter;
      const sourceCountAfter = Array.isArray(sourceTasksAfter)
        ? sourceTasksAfter.length
        : 0;

      const targetAfter = await request.get(`/api/projects/${targetId}/tasks`);
      const targetDataAfter = await targetAfter.json();
      const targetTasksAfter =
        targetDataAfter.tasks ?? targetDataAfter.data ?? targetDataAfter.items ?? targetDataAfter;
      const targetCountAfter = Array.isArray(targetTasksAfter)
        ? targetTasksAfter.length
        : 0;

      expect(sourceCountAfter).toBe(sourceCountBefore - 1);
      expect(targetCountAfter).toBe(targetCountBefore + 1);
    }
  });
});

import { test, expect } from "@playwright/test";
import { getDbClient, findTable, findColumn } from "../helpers/db.js";

test.describe("Tier 2 — Core CRUD", () => {
  test("projects list returns data", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.status()).toBe(200);
    const data = await res.json();
    const projects = data.projects ?? data.data ?? data;
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(p.id ?? p.ID).toBeDefined();
      expect(p.name ?? p.Name).toBeDefined();
    }
  });

  test("project detail returns tasks", async ({ request }) => {
    // First get a valid project ID
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const projectId = projects[0].id ?? projects[0].ID;

    const res = await request.get(`/api/projects/${projectId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data?.tasks ?? [];
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  test("create task via API", async ({ request }) => {
    // Get a valid project ID
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const projectId = projects[0].id ?? projects[0].ID;

    const taskTitle = `API Test Task ${Date.now()}`;
    const res = await request.post(`/api/projects/${projectId}/tasks`, {
      data: {
        title: taskTitle,
        description: "Created via API test",
        status: "todo",
        priority: "medium",
      },
    });
    expect([200, 201]).toContain(res.status());
    const task = await res.json();
    const returnedTitle = task.title ?? task.Title;
    expect(returnedTitle).toBe(taskTitle);
  });

  test("created task exists in DB", async ({ request }) => {
    // Get a valid project ID
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const projectId = projects[0].id ?? projects[0].ID;

    const taskTitle = `DB Verify Task ${Date.now()}`;
    await request.post(`/api/projects/${projectId}/tasks`, {
      data: {
        title: taskTitle,
        description: "Verify in DB",
        status: "todo",
        priority: "medium",
      },
    });

    const db = await getDbClient();
    try {
      const table = await findTable(db, ["Task", "Tasks", "task", "tasks"]);
      expect(table).not.toBeNull();
      const titleCol = await findColumn(db, table!, ["title", "Title"]);
      const res = await db.query(
        `SELECT * FROM "${table}" WHERE "${titleCol}" = $1`,
        [taskTitle]
      );
      expect(res.rows.length).toBeGreaterThanOrEqual(1);
    } finally {
      await db.end();
    }
  });

  test("created task appears in API listing", async ({ request }) => {
    // Get a valid project ID
    const listRes = await request.get("/api/projects");
    const listData = await listRes.json();
    const projects = listData.projects ?? listData.data ?? listData;
    const projectId = projects[0].id ?? projects[0].ID;

    const taskTitle = `Listing Check Task ${Date.now()}`;
    await request.post(`/api/projects/${projectId}/tasks`, {
      data: {
        title: taskTitle,
        description: "Should show in listing",
        status: "todo",
        priority: "medium",
      },
    });

    const tasksRes = await request.get(`/api/projects/${projectId}/tasks`);
    expect(tasksRes.status()).toBe(200);
    const tasksData = await tasksRes.json();
    const tasks = tasksData.tasks ?? tasksData.data ?? tasksData.items ?? tasksData;
    const found = (Array.isArray(tasks) ? tasks : []).some(
      (t: Record<string, unknown>) => (t.title ?? t.Title) === taskTitle
    );
    expect(found).toBe(true);
  });

  test("dashboard returns real counts", async ({ request }) => {
    const res = await request.get("/api/dashboard");
    expect(res.status()).toBe(200);
    const data = await res.json();
    const totalTasks =
      data.totalTasks ?? data.total_tasks ?? data.taskCount ?? data.task_count;
    expect(typeof totalTasks).toBe("number");
    expect(totalTasks).toBeGreaterThanOrEqual(22);
  });
});

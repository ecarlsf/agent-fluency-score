import { test, expect } from "@playwright/test";

async function getFirstProjectId(request: any): Promise<number> {
  const res = await request.get("/api/projects");
  const data = await res.json();
  const projects = data.projects ?? data.data ?? data;
  return projects[0].id ?? projects[0].ID;
}

test.describe("Tier 3 — Complex Queries", () => {
  test("status filter = todo", async ({ request }) => {
    const projectId = await getFirstProjectId(request);
    const res = await request.get(
      `/api/projects/${projectId}/tasks?status=todo`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data ?? data.items ?? data;
    expect(Array.isArray(tasks)).toBe(true);
    for (const t of tasks) {
      expect(t.status).toBe("todo");
    }
  });

  test("status filter = done", async ({ request }) => {
    const projectId = await getFirstProjectId(request);
    const res = await request.get(
      `/api/projects/${projectId}/tasks?status=done`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data ?? data.items ?? data;
    expect(Array.isArray(tasks)).toBe(true);
    for (const t of tasks) {
      expect(t.status).toBe("done");
    }
  });

  test("assignee filter", async ({ request }) => {
    const projectId = await getFirstProjectId(request);
    const res = await request.get(
      `/api/projects/${projectId}/tasks?assignee=1`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data ?? data.items ?? data;
    expect(Array.isArray(tasks)).toBe(true);
    for (const t of tasks) {
      const assigneeId =
        t.assigneeId ?? t.assignee_id ?? t.assignee?.id ?? t.AssigneeId;
      expect(assigneeId).toBe(1);
    }
  });

  test("pagination limits results", async ({ request }) => {
    const projectId = await getFirstProjectId(request);
    const res = await request.get(
      `/api/projects/${projectId}/tasks?page=1&limit=3`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data ?? data.items ?? data;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeLessThanOrEqual(3);
  });

  test("pagination total count", async ({ request }) => {
    const projectId = await getFirstProjectId(request);

    // Get full list
    const fullRes = await request.get(`/api/projects/${projectId}/tasks`);
    const fullData = await fullRes.json();
    const fullTasks = fullData.tasks ?? fullData.data ?? fullData.items ?? fullData;
    const fullCount = Array.isArray(fullTasks) ? fullTasks.length : 0;

    // Get paginated
    const pagRes = await request.get(
      `/api/projects/${projectId}/tasks?page=1&limit=3`
    );
    const pagData = await pagRes.json();
    const total =
      pagData.total ?? pagData.totalCount ?? pagData.total_count ?? pagData.count;
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThanOrEqual(fullCount);
  });

  test("combined filter + pagination", async ({ request }) => {
    const projectId = await getFirstProjectId(request);
    const res = await request.get(
      `/api/projects/${projectId}/tasks?status=todo&page=1&limit=5`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    const tasks = data.tasks ?? data.data ?? data.items ?? data;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeLessThanOrEqual(5);
    for (const t of tasks) {
      expect(t.status).toBe("todo");
    }
  });
});

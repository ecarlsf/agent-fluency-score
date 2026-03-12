import { test, expect } from "@playwright/test";
import {
  getDbClient,
  findTable,
  tableHasColumns,
  getRowCount,
} from "../helpers/db.js";

test.describe("Tier 1 — Basic Setup", () => {
  test("home page returns < 500", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBeLessThan(500);
  });

  test("dashboard page returns < 500", async ({ request }) => {
    const res = await request.get("/dashboard");
    expect(res.status()).toBeLessThan(500);
  });

  test("projects page returns < 500", async ({ request }) => {
    const res = await request.get("/projects");
    expect(res.status()).toBeLessThan(500);
  });

  test("DB has organizations table", async () => {
    const db = await getDbClient();
    try {
      const table = await findTable(db, [
        "Organization",
        "Organizations",
        "organization",
        "organizations",
        "org",
        "orgs",
      ]);
      expect(table).not.toBeNull();

      const { missing } = await tableHasColumns(db, table!, [
        ["id"],
        ["name"],
        ["slug"],
      ]);
      expect(missing).toEqual([]);
    } finally {
      await db.end();
    }
  });

  test("DB has users table", async () => {
    const db = await getDbClient();
    try {
      const table = await findTable(db, [
        "User",
        "Users",
        "user",
        "users",
      ]);
      expect(table).not.toBeNull();

      const { missing } = await tableHasColumns(db, table!, [
        ["id"],
        ["name"],
        ["email"],
        ["role"],
        ["organizationId", "organization_id", "org_id", "orgId"],
      ]);
      expect(missing).toEqual([]);
    } finally {
      await db.end();
    }
  });

  test("DB has projects table", async () => {
    const db = await getDbClient();
    try {
      const table = await findTable(db, [
        "Project",
        "Projects",
        "project",
        "projects",
      ]);
      expect(table).not.toBeNull();

      const { missing } = await tableHasColumns(db, table!, [
        ["id"],
        ["name"],
        ["description"],
        ["status"],
        ["organizationId", "organization_id", "org_id", "orgId"],
      ]);
      expect(missing).toEqual([]);
    } finally {
      await db.end();
    }
  });

  test("DB has tasks table", async () => {
    const db = await getDbClient();
    try {
      const table = await findTable(db, [
        "Task",
        "Tasks",
        "task",
        "tasks",
      ]);
      expect(table).not.toBeNull();

      const { missing } = await tableHasColumns(db, table!, [
        ["id"],
        ["title"],
        ["status"],
        ["priority"],
        ["projectId", "project_id"],
      ]);
      expect(missing).toEqual([]);
    } finally {
      await db.end();
    }
  });

  test("DB is seeded", async () => {
    const db = await getDbClient();
    try {
      const orgTable = await findTable(db, [
        "Organization", "Organizations", "organization", "organizations", "org", "orgs",
      ]);
      const userTable = await findTable(db, [
        "User", "Users", "user", "users",
      ]);
      const projectTable = await findTable(db, [
        "Project", "Projects", "project", "projects",
      ]);
      const taskTable = await findTable(db, [
        "Task", "Tasks", "task", "tasks",
      ]);

      expect(orgTable).not.toBeNull();
      expect(userTable).not.toBeNull();
      expect(projectTable).not.toBeNull();
      expect(taskTable).not.toBeNull();

      const orgs = await getRowCount(db, orgTable!);
      const users = await getRowCount(db, userTable!);
      const projects = await getRowCount(db, projectTable!);
      const tasks = await getRowCount(db, taskTable!);

      expect(orgs).toBeGreaterThanOrEqual(3);
      expect(users).toBeGreaterThanOrEqual(5);
      expect(projects).toBeGreaterThanOrEqual(5);
      expect(tasks).toBeGreaterThanOrEqual(22);
    } finally {
      await db.end();
    }
  });

  test("API projects endpoint works", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.status()).toBe(200);
    const data = await res.json();
    const projects = data.projects ?? data.data ?? data;
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(5);
  });
});

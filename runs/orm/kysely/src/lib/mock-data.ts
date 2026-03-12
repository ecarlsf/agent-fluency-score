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
  archivedAt: string | null;
}

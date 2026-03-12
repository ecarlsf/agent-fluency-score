import { NextResponse } from "next/server";
import { getProjects, getTasks, getUsers } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [projects, tasks, users] = await Promise.all([
    getProjects(),
    getTasks(),
    getUsers(),
  ]);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalUsers = users.length;

  return NextResponse.json({
    totalProjects,
    totalTasks,
    todoCount,
    inProgressCount,
    doneCount,
    totalUsers,
  });
}

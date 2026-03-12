import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalProjects, totalUsers, todoCount, inProgressCount, doneCount] =
    await Promise.all([
      prisma.project.count(),
      prisma.user.count(),
      prisma.task.count({ where: { status: "todo", deletedAt: null } }),
      prisma.task.count({ where: { status: "in_progress", deletedAt: null } }),
      prisma.task.count({ where: { status: "done", deletedAt: null } }),
    ]);

  const totalTasks = todoCount + inProgressCount + doneCount;

  return NextResponse.json({
    totalProjects,
    totalTasks,
    todoCount,
    inProgressCount,
    doneCount,
    totalUsers,
  });
}

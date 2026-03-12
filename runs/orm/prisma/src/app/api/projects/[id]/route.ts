import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const project = await prisma.project.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: id, deletedAt: null },
    include: { assignee: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ project, tasks });
}

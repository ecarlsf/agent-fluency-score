import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const projectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: null },
  });

  return NextResponse.json(updated);
}

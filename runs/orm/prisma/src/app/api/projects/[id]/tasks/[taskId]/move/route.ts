import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const sourceProjectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);
  const body = await request.json();
  const targetProjectId = parseInt(body.targetProjectId, 10);

  if (!targetProjectId || targetProjectId === sourceProjectId) {
    return NextResponse.json(
      { error: "targetProjectId is required and must differ from the source project" },
      { status: 400 }
    );
  }

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, projectId: sourceProjectId },
      });
      if (!task) {
        throw new Error("TASK_NOT_FOUND");
      }

      const targetProject = await tx.project.findUnique({
        where: { id: targetProjectId },
      });
      if (!targetProject) {
        throw new Error("TARGET_NOT_FOUND");
      }

      return tx.task.update({
        where: { id: taskId },
        data: { projectId: targetProjectId },
      });
    });

    return NextResponse.json(updatedTask);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    if (message === "TASK_NOT_FOUND") {
      return NextResponse.json(
        { error: "Task not found in this project" },
        { status: 404 }
      );
    }
    if (message === "TARGET_NOT_FOUND") {
      return NextResponse.json(
        { error: "Target project not found" },
        { status: 404 }
      );
    }
    throw e;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { moveTask } from "@/lib/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const fromProjectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);
  const body = await request.json();
  const toProjectId = body.targetProjectId ?? body.projectId;

  if (!toProjectId || typeof toProjectId !== "number") {
    return NextResponse.json(
      { error: "targetProjectId is required and must be a number" },
      { status: 400 }
    );
  }

  if (toProjectId === fromProjectId) {
    return NextResponse.json(
      { error: "Task is already in this project" },
      { status: 400 }
    );
  }

  const task = await moveTask(taskId, fromProjectId, toProjectId);

  if (!task) {
    return NextResponse.json(
      { error: "Task or target project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}

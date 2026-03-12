import { NextRequest, NextResponse } from "next/server";
import { moveTask } from "@/lib/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const fromProjectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);
  const body = await request.json();
  const toProjectId = body.projectId ?? body.targetProjectId ?? body.toProjectId;

  if (!toProjectId || typeof toProjectId !== "number") {
    return NextResponse.json(
      { error: "projectId is required and must be a number" },
      { status: 400 }
    );
  }

  if (toProjectId === fromProjectId) {
    return NextResponse.json(
      { error: "Task is already in this project" },
      { status: 400 }
    );
  }

  try {
    const task = await moveTask(taskId, fromProjectId, toProjectId);
    return NextResponse.json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Move failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

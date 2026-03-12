import { NextRequest, NextResponse } from "next/server";
import { moveTask } from "@/lib/mock-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const fromProjectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);

  let body: { projectId?: number; targetProjectId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const toProjectId = body.targetProjectId ?? body.projectId;
  if (!toProjectId || typeof toProjectId !== "number") {
    return NextResponse.json(
      { error: "targetProjectId is required and must be a number" },
      { status: 400 }
    );
  }

  if (toProjectId === fromProjectId) {
    return NextResponse.json(
      { error: "Task is already in that project" },
      { status: 400 }
    );
  }

  try {
    await moveTask(taskId, fromProjectId, toProjectId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Move failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

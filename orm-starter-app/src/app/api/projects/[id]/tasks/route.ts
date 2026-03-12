import { NextRequest, NextResponse } from "next/server";
import { getTasksForProject } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const tasks = getTasksForProject(id);

  // Query params accepted but ignored in stub — agent implements real filtering
  return NextResponse.json({ tasks, total: tasks.length });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const body = await request.json();

  // Stub: return fake task (no persist) — agent replaces with real DB insert
  const fakeTask = {
    id: Date.now(),
    title: body.title || "Untitled",
    description: body.description || "",
    status: body.status || "todo",
    priority: body.priority || "medium",
    dueDate: body.dueDate || null,
    createdAt: new Date().toISOString(),
    projectId: id,
    assigneeId: body.assigneeId || null,
  };

  return NextResponse.json(fakeTask, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { restoreTask } from "@/lib/queries";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const projectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);

  const task = await restoreTask(taskId, projectId);

  if (!task) {
    return NextResponse.json(
      { error: "Task not found or not archived" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}

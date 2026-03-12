import { NextRequest, NextResponse } from "next/server";
import { restoreTask } from "@/lib/queries";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const projectId = parseInt(params.id, 10);
  const taskId = parseInt(params.taskId, 10);

  try {
    const task = await restoreTask(taskId, projectId);
    return NextResponse.json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

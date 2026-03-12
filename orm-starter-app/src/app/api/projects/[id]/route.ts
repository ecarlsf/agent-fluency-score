import { NextRequest, NextResponse } from "next/server";
import { getProject, getTasksForProject } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const project = getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tasks = getTasksForProject(id);

  return NextResponse.json({ project, tasks });
}

import { NextRequest, NextResponse } from "next/server";
import { getFilteredTasksForProject, createTask } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const url = request.nextUrl;
  const status = url.searchParams.get("status") || undefined;
  const assignee = url.searchParams.get("assignee") || undefined;
  const page = url.searchParams.get("page")
    ? parseInt(url.searchParams.get("page")!, 10)
    : undefined;
  const limit = url.searchParams.get("limit")
    ? parseInt(url.searchParams.get("limit")!, 10)
    : undefined;

  const result = await getFilteredTasksForProject(id, {
    status,
    assignee,
    page,
    limit,
  });

  const paginate = page != null || limit != null;
  return NextResponse.json({
    tasks: result.tasks,
    total: result.total,
    ...(paginate ? { page: page ?? 1, limit: limit ?? 10 } : {}),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const body = await request.json();

  const task = await createTask({
    title: body.title || "Untitled",
    description: body.description || "",
    status: body.status || "todo",
    priority: body.priority || "medium",
    dueDate: body.dueDate || null,
    projectId: id,
    assigneeId: body.assigneeId || null,
  });

  return NextResponse.json(task, { status: 201 });
}

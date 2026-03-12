import { NextRequest, NextResponse } from "next/server";
import { getFilteredTasksForProject, createTask } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const url = request.nextUrl;

  const status = url.searchParams.get("status") || undefined;
  const assigneeParam = url.searchParams.get("assignee");
  const assigneeId = assigneeParam ? parseInt(assigneeParam, 10) : undefined;
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");

  // Only paginate when page or limit is explicitly requested
  const page = pageParam ? (parseInt(pageParam, 10) || 1) : undefined;
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 10, 100) : undefined;

  const { tasks, total } = await getFilteredTasksForProject(id, {
    status,
    assigneeId: assigneeId !== undefined && !isNaN(assigneeId) ? assigneeId : undefined,
    page,
    limit,
  });

  return NextResponse.json({ tasks, total, ...(page !== undefined && { page }), ...(limit !== undefined && { limit }) });
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

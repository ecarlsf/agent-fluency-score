import { NextRequest, NextResponse } from "next/server";
import { getFilteredTasks } from "@/lib/mock-data";
import { getRepo } from "@/lib/data-source";
import type { Task } from "@/lib/entities/Task";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const url = request.nextUrl.searchParams;

  const status = url.get("status") || undefined;
  const assignee = url.get("assignee");
  const page = url.get("page") ? parseInt(url.get("page")!, 10) : 1;
  const limit = url.get("limit") ? parseInt(url.get("limit")!, 10) : undefined;

  const result = await getFilteredTasks(id, {
    status,
    assigneeId: assignee ? parseInt(assignee, 10) : undefined,
    page,
    limit,
  });

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const body = await request.json();

  const taskRepo = await getRepo<Task>("tasks");

  const task = taskRepo.create({
    title: body.title || "Untitled",
    description: body.description || "",
    status: body.status || "todo",
    priority: body.priority || "medium",
    dueDate: body.dueDate || null,
    createdAt: new Date().toISOString(),
    projectId: id,
    assigneeId: body.assigneeId || null,
  });

  const saved = await taskRepo.save(task);

  return NextResponse.json(saved, { status: 201 });
}

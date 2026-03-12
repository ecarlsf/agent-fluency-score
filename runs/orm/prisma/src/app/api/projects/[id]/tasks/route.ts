import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const { searchParams } = request.nextUrl;

  const where: Record<string, unknown> = { projectId: id, deletedAt: null };
  if (searchParams.get("status")) where.status = searchParams.get("status");
  const assigneeParam = searchParams.get("assignee") || searchParams.get("assigneeId");
  if (assigneeParam) where.assigneeId = parseInt(assigneeParam, 10);

  const paginated = searchParams.has("page") || searchParams.has("limit");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const skip = paginated ? (page - 1) * limit : undefined;
  const take = paginated ? limit : undefined;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { assignee: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({
    tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const body = await request.json();

  const task = await prisma.task.create({
    data: {
      title: body.title || "Untitled",
      description: body.description || "",
      status: body.status || "todo",
      priority: body.priority || "medium",
      createdAt: new Date().toISOString(),
      dueDate: body.dueDate || null,
      projectId: id,
      assigneeId: body.assigneeId ? parseInt(body.assigneeId, 10) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    organizationId: p.organizationId,
    taskCount: p._count.tasks,
  }));

  return NextResponse.json({ projects: result });
}

import { NextResponse } from "next/server";
import { getProjects, getTaskCountForProject } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await getProjects();

  const result = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      taskCount: await getTaskCountForProject(p.id),
    }))
  );

  return NextResponse.json({ projects: result });
}

import { NextResponse } from "next/server";
import { projects, getTaskCountForProject } from "@/lib/mock-data";

export async function GET() {
  const result = projects.map((p) => ({
    ...p,
    taskCount: getTaskCountForProject(p.id),
  }));

  return NextResponse.json({ projects: result });
}

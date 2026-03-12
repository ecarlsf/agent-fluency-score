import { NextResponse } from "next/server";
import { getProjectsWithTaskCounts } from "@/lib/queries";

export async function GET() {
  const projects = await getProjectsWithTaskCounts();
  return NextResponse.json({ projects });
}

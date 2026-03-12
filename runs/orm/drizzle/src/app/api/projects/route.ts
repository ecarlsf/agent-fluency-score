import { NextResponse } from "next/server";
import { getProjectsWithTaskCount } from "@/lib/queries";

export async function GET() {
  const projects = await getProjectsWithTaskCount();
  return NextResponse.json({ projects });
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProject } from "@/lib/mock-data";

export default function ArchivedTasksPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = parseInt(params.id, 10);
  const project = getProject(projectId);
  if (!project) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archived Tasks</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}`}>Back to Project</Link>
        </Button>
      </div>
      <p className="text-muted-foreground">No archived tasks.</p>
    </div>
  );
}

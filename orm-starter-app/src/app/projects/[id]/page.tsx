import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProject, getTasksForProject, getUser, organizations } from "@/lib/mock-data";

function statusVariant(status: string) {
  switch (status) {
    case "done": return "default" as const;
    case "in_progress": return "secondary" as const;
    case "todo": return "outline" as const;
    default: return "outline" as const;
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case "urgent": return "destructive" as const;
    case "high": return "default" as const;
    case "medium": return "secondary" as const;
    case "low": return "outline" as const;
    default: return "outline" as const;
  }
}

export default function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string; assignee?: string };
}) {
  const projectId = parseInt(params.id, 10);
  const project = getProject(projectId);
  if (!project) return notFound();

  const org = organizations.find((o) => o.id === project.organizationId);
  const projectTasks = getTasksForProject(projectId);

  // Filter stubs — searchParams are accepted but filtering is non-functional until ORM is wired
  void searchParams.status;
  void searchParams.assignee;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization: {org?.name ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/projects/${project.id}/tasks/new`}>Add Task</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/archived`}>Archived</Link>
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectTasks.map((task) => {
            const assignee = task.assigneeId ? getUser(task.assigneeId) : null;
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>{assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

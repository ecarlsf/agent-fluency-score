import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProject, getArchivedTasksForProject, getUser } from "@/lib/queries";
import { RestoreTaskButton } from "@/components/archive-task-button";

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

export default async function ArchivedTasksPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = parseInt(params.id, 10);
  const project = await getProject(projectId);
  if (!project) return notFound();

  const archivedTasks = await getArchivedTasksForProject(projectId);

  const tasksWithAssignees = await Promise.all(
    archivedTasks.map(async (task) => {
      const assignee = task.assigneeId ? await getUser(task.assigneeId) : null;
      return { ...task, assigneeName: assignee?.name ?? "Unassigned" };
    })
  );

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

      {tasksWithAssignees.length === 0 ? (
        <p className="text-muted-foreground">No archived tasks.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksWithAssignees.map((task) => (
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
                <TableCell>{task.assigneeName}</TableCell>
                <TableCell>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <RestoreTaskButton taskId={task.id} projectId={projectId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

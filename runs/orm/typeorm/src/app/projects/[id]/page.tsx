import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProject, getOrganization, getUser, getUsers, getProjects, getFilteredTasks } from "@/lib/mock-data";
import { TaskFilters, Pagination } from "@/components/task-filters";
import { MoveTaskButton } from "@/components/move-task-button";
import { ArchiveTaskButton } from "@/components/archive-task-button";

export const dynamic = "force-dynamic";

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

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string; assignee?: string; page?: string };
}) {
  const projectId = parseInt(params.id, 10);
  const project = await getProject(projectId);
  if (!project) return notFound();

  const [org, users, allProjects] = await Promise.all([
    getOrganization(project.organizationId),
    getUsers(),
    getProjects(),
  ]);

  const statusFilter = searchParams.status || "";
  const assigneeFilter = searchParams.assignee || "";
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  const { tasks, total, totalPages } = await getFilteredTasks(projectId, {
    status: statusFilter || undefined,
    assigneeId: assigneeFilter ? parseInt(assigneeFilter, 10) : undefined,
    page,
    limit: 10,
  });

  // Resolve assignee names for the current page of tasks
  const tasksWithAssignees = await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      assigneeName: task.assigneeId
        ? (await getUser(task.assigneeId))?.name ?? "Unassigned"
        : "Unassigned",
    }))
  );

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

      <TaskFilters
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        currentStatus={statusFilter}
        currentAssignee={assigneeFilter}
      />

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
          {tasksWithAssignees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            tasksWithAssignees.map((task) => (
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
                  <div className="flex gap-1">
                    <MoveTaskButton
                      taskId={task.id}
                      currentProjectId={projectId}
                      projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
                    />
                    <ArchiveTaskButton taskId={task.id} projectId={projectId} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

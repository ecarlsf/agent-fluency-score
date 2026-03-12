import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { MoveTaskForm } from "@/components/move-task-form";
import { ArchiveTaskButton } from "@/components/archive-task-button";

const PAGE_SIZE = 10;

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

function buildQuery(projectId: number, overrides: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(overrides)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return `/projects/${projectId}${qs ? `?${qs}` : ""}`;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string; assignee?: string; page?: string };
}) {
  const projectId = parseInt(params.id, 10);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  });
  if (!project) return notFound();

  const taskWhere: Record<string, unknown> = { projectId, deletedAt: null };
  if (searchParams.status) taskWhere.status = searchParams.status;
  if (searchParams.assignee) taskWhere.assigneeId = parseInt(searchParams.assignee, 10);

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [projectTasks, totalCount, users, allProjects] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      include: { assignee: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.task.count({ where: taskWhere }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const currentStatus = searchParams.status || "";
  const currentAssignee = searchParams.assignee || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization: {project.organization?.name ?? "—"}
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

      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
          <div className="flex gap-2">
            {[
              { label: "All", value: "" },
              { label: "To Do", value: "todo" },
              { label: "In Progress", value: "in_progress" },
              { label: "Done", value: "done" },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={currentStatus === opt.value ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildQuery(projectId, { status: opt.value, assignee: currentAssignee })}>
                  {opt.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="assignee-filter" className="text-sm font-medium">Assignee</label>
          <div className="flex gap-2">
            <Button
              variant={currentAssignee === "" ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={buildQuery(projectId, { status: currentStatus, assignee: "" })}>
                All
              </Link>
            </Button>
            {users.map((u) => (
              <Button
                key={u.id}
                variant={currentAssignee === String(u.id) ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildQuery(projectId, { status: currentStatus, assignee: String(u.id) })}>
                  {u.name}
                </Link>
              </Button>
            ))}
          </div>
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectTasks.map((task) => (
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
              <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
              <TableCell>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MoveTaskForm
                    taskId={task.id}
                    currentProjectId={projectId}
                    projects={allProjects}
                  />
                  <ArchiveTaskButton
                    taskId={task.id}
                    projectId={projectId}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {projectTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No tasks found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, totalCount)} of {totalCount} tasks
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildQuery(projectId, { status: currentStatus, assignee: currentAssignee, page: String(page - 1) })}>
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            <span className="flex items-center text-sm px-2">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildQuery(projectId, { status: currentStatus, assignee: currentAssignee, page: String(page + 1) })}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

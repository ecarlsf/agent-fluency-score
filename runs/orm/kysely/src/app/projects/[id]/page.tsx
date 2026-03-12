import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProject, getFilteredTasksForProject, getUser, getOrganization, getAllUsers, getAllProjects } from "@/lib/queries";
import { FilterSelect } from "./filter-select";
import { MoveTaskSelect } from "./move-task-select";
import { ArchiveTaskButton } from "./archive-task-button";

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

function buildFilterUrl(
  projectId: number,
  current: { status?: string; assignee?: string; page?: string },
  overrides: { status?: string; assignee?: string; page?: string }
) {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (merged.status) params.set("status", merged.status);
  if (merged.assignee) params.set("assignee", merged.assignee);
  if (merged.page && merged.page !== "1") params.set("page", merged.page);
  const qs = params.toString();
  return `/projects/${projectId}${qs ? `?${qs}` : ""}`;
}

const ITEMS_PER_PAGE = 10;

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

  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const statusFilter = searchParams.status || undefined;
  const assigneeFilter = searchParams.assignee ? parseInt(searchParams.assignee, 10) : undefined;

  const [org, { tasks: projectTasks, total }, allUsers, allProjects] = await Promise.all([
    getOrganization(project.organizationId),
    getFilteredTasksForProject(projectId, {
      status: statusFilter,
      assigneeId: assigneeFilter,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    getAllUsers(),
    getAllProjects(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Resolve assignee names for each task
  const tasksWithAssignees = await Promise.all(
    projectTasks.map(async (task) => ({
      task,
      assignee: task.assigneeId ? await getUser(task.assigneeId) : null,
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

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <FilterSelect
            id="status-filter"
            value={searchParams.status}
            placeholder="All statuses"
            options={[
              { value: "todo", label: "To Do" },
              { value: "in_progress", label: "In Progress" },
              { value: "done", label: "Done" },
            ]}
            buildHref={(val) =>
              buildFilterUrl(projectId, searchParams, {
                status: val,
                page: "1",
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="assignee-filter" className="text-sm font-medium text-muted-foreground">
            Assignee
          </label>
          <FilterSelect
            id="assignee-filter"
            value={searchParams.assignee}
            placeholder="All assignees"
            options={allUsers.map((u) => ({
              value: String(u.id),
              label: u.name,
            }))}
            buildHref={(val) =>
              buildFilterUrl(projectId, searchParams, {
                assignee: val,
                page: "1",
              })
            }
          />
        </div>
        {(searchParams.status || searchParams.assignee) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${projectId}`}>Clear filters</Link>
          </Button>
        )}
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
          {tasksWithAssignees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            tasksWithAssignees.map(({ task, assignee }) => (
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
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MoveTaskSelect
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} tasks
          </p>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={buildFilterUrl(projectId, searchParams, {
                    page: String(currentPage - 1),
                  })}
                >
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={buildFilterUrl(projectId, searchParams, {
                    page: String(currentPage + 1),
                  })}
                >
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

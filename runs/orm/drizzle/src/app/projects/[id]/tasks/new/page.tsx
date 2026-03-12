import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProject, getUsers, createTask } from "@/lib/queries";

export default async function NewTaskPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id, 10);
  const project = await getProject(projectId);
  if (!project) return notFound();

  const allUsers = await getUsers();

  async function handleCreateTask(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const status = (formData.get("status") as "todo" | "in_progress" | "done") || "todo";
    const priority = (formData.get("priority") as "low" | "medium" | "high" | "urgent") || "medium";
    const assigneeIdStr = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdStr ? parseInt(assigneeIdStr, 10) : null;
    const dueDateStr = formData.get("dueDate") as string;
    const dueDate = dueDateStr || null;

    await createTask({
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    });

    redirect(`/projects/${projectId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Task</h1>
        <p className="text-muted-foreground">
          Add a task to {project.name}
        </p>
      </div>

      <form action={handleCreateTask} className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Task title" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Task description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue="todo"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assignee</Label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue=""
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Unassigned</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Create Task</Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

function statusVariant(status: string) {
  switch (status) {
    case "active": return "default" as const;
    case "planning": return "secondary" as const;
    case "archived": return "outline" as const;
    default: return "default" as const;
  }
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      organization: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Projects</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {project.name}
                </Link>
              </TableCell>
              <TableCell>{project.organization?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(project.status)}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {project._count.tasks}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

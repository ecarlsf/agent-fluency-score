"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Project {
  id: number;
  name: string;
}

export function MoveTaskButton({
  taskId,
  currentProjectId,
  projects,
}: {
  taskId: number;
  currentProjectId: number;
  projects: Project[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  async function handleMove(toProjectId: number) {
    setMoving(true);
    const res = await fetch(
      `/api/projects/${currentProjectId}/tasks/${taskId}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProjectId: toProjectId }),
      }
    );

    if (res.ok) {
      router.refresh();
    }
    setMoving(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Move
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={moving}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) handleMove(parseInt(e.target.value, 10));
        }}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Select project…
        </option>
        {otherProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        size="sm"
        disabled={moving}
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>
    </div>
  );
}

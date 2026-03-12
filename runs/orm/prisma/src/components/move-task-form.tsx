"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Project {
  id: number;
  name: string;
}

export function MoveTaskForm({
  taskId,
  currentProjectId,
  projects,
}: {
  taskId: number;
  currentProjectId: number;
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Move
      </Button>
    );
  }

  async function handleMove() {
    if (!targetId) return;
    setLoading(true);
    const res = await fetch(
      `/api/projects/${currentProjectId}/tasks/${taskId}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProjectId: parseInt(targetId, 10) }),
      }
    );
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        <option value="">Select project…</option>
        {otherProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={handleMove} disabled={!targetId || loading}>
        {loading ? "Moving…" : "Go"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}

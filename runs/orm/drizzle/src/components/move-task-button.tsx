"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function MoveTaskButton({
  taskId,
  currentProjectId,
  projects,
}: {
  taskId: number;
  currentProjectId: number;
  projects: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  async function handleMove() {
    if (!targetId) return;
    const res = await fetch(
      `/api/projects/${currentProjectId}/tasks/${taskId}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProjectId: parseInt(targetId, 10) }),
      }
    );
    if (res.ok) {
      startTransition(() => {
        router.refresh();
      });
      setOpen(false);
      setTargetId("");
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Move
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Select project…</option>
        {otherProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={!targetId || isPending}
        onClick={handleMove}
      >
        {isPending ? "Moving…" : "Confirm"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(false);
          setTargetId("");
        }}
      >
        Cancel
      </Button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MoveTaskSelect({
  taskId,
  currentProjectId,
  projects,
}: {
  taskId: number;
  currentProjectId: number;
  projects: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  async function handleMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const toProjectId = parseInt(e.target.value, 10);
    if (!toProjectId) return;

    setMoving(true);
    try {
      const res = await fetch(
        `/api/projects/${currentProjectId}/tasks/${taskId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: toProjectId }),
        }
      );
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setMoving(false);
    }
  }

  return (
    <select
      onChange={handleMove}
      disabled={moving}
      value=""
      className="flex h-8 w-[140px] rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
    >
      <option value="">Move to…</option>
      {otherProjects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

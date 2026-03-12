"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ArchiveTaskButton({
  taskId,
  projectId,
}: {
  taskId: number;
  projectId: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleArchive() {
    setLoading(true);
    const res = await fetch(
      `/api/projects/${projectId}/tasks/${taskId}/archive`,
      { method: "POST" }
    );
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleArchive} disabled={loading}>
      {loading ? "Archiving…" : "Archive"}
    </Button>
  );
}

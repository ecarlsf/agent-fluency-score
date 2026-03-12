"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RestoreTaskButton({
  taskId,
  projectId,
}: {
  taskId: number;
  projectId: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRestore() {
    setLoading(true);
    const res = await fetch(
      `/api/projects/${projectId}/tasks/${taskId}/restore`,
      { method: "POST" }
    );
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestore} disabled={loading}>
      {loading ? "Restoring…" : "Restore"}
    </Button>
  );
}

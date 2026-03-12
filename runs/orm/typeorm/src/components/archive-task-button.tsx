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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <Button variant="outline" size="sm" disabled={loading} onClick={handleArchive}>
      Archive
    </Button>
  );
}

export function RestoreTaskButton({
  taskId,
  projectId,
}: {
  taskId: number;
  projectId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <Button variant="outline" size="sm" disabled={loading} onClick={handleRestore}>
      Restore
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ArchiveTaskButton({
  taskId,
  projectId,
}: {
  taskId: number;
  projectId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleArchive() {
    const res = await fetch(
      `/api/projects/${projectId}/tasks/${taskId}/archive`,
      { method: "POST" }
    );
    if (res.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleArchive}
    >
      {isPending ? "Archiving…" : "Archive"}
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
  const [isPending, startTransition] = useTransition();

  async function handleRestore() {
    const res = await fetch(
      `/api/projects/${projectId}/tasks/${taskId}/restore`,
      { method: "POST" }
    );
    if (res.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleRestore}
    >
      {isPending ? "Restoring…" : "Restore"}
    </Button>
  );
}

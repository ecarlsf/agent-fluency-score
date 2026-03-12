"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArchiveTaskButton({
  taskId,
  projectId,
}: {
  taskId: number;
  projectId: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleArchive() {
    setPending(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/archive`,
        { method: "POST" }
      );
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleArchive}
      disabled={pending}
      className="text-xs"
    >
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
  const [pending, setPending] = useState(false);

  async function handleRestore() {
    setPending(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/restore`,
        { method: "POST" }
      );
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={pending}
    >
      Restore
    </Button>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/auth";

export async function createPost(formData: FormData) {
  const user = await getOrCreateDbUser();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: user.id,
      organizationId: user.organizationId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updatePost(formData: FormData) {
  const user = await getOrCreateDbUser();
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  await prisma.post.update({
    where: { id, organizationId: user.organizationId },
    data: { title, content, published },
  });

  revalidatePath("/dashboard");
}

export async function deletePost(formData: FormData) {
  const user = await getOrCreateDbUser();
  const id = Number(formData.get("id"));

  await prisma.post.delete({
    where: { id, organizationId: user.organizationId },
  });

  revalidatePath("/dashboard");
}

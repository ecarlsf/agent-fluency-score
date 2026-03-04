"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = 1;

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: DEFAULT_USER_ID,
    },
  });

  revalidatePath("/dashboard");
}

export async function updatePost(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  await prisma.post.update({
    where: { id },
    data: { title, content, published },
  });

  revalidatePath("/dashboard");
}

export async function deletePost(formData: FormData) {
  const id = Number(formData.get("id"));

  await prisma.post.delete({ where: { id } });

  revalidatePath("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function createPost(formData: FormData) {
  const user = await getAuthUser();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: user.id,
      orgId: user.orgId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updatePost(formData: FormData) {
  const user = await getAuthUser();
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  // Users can edit posts in their org, or their own posts if no org
  const where = user.orgId
    ? { id, orgId: user.orgId }
    : { id, authorId: user.id };

  await prisma.post.update({
    where,
    data: { title, content, published },
  });

  revalidatePath("/dashboard");
}

export async function deletePost(formData: FormData) {
  const user = await getAuthUser();
  const id = Number(formData.get("id"));

  const where = user.orgId
    ? { id, orgId: user.orgId }
    : { id, authorId: user.id };

  await prisma.post.delete({ where });

  revalidatePath("/dashboard");
}

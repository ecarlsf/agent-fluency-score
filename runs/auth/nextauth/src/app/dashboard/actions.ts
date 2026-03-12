"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAuthedUser() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");
  return {
    userId: Number(session.user.id),
    orgId: session.user.orgId ?? null,
  };
}

export async function createPost(formData: FormData) {
  const { userId, orgId } = await getAuthedUser();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: userId,
      orgId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updatePost(formData: FormData) {
  const { orgId } = await getAuthedUser();
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  await prisma.post.update({
    where: { id, orgId },
    data: { title, content, published },
  });

  revalidatePath("/dashboard");
}

export async function deletePost(formData: FormData) {
  const { orgId } = await getAuthedUser();
  const id = Number(formData.get("id"));

  await prisma.post.delete({ where: { id, orgId } });

  revalidatePath("/dashboard");
}

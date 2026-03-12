"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { name, email },
  });

  revalidatePath("/settings");
}

export async function updateOrganization(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const orgName = formData.get("orgName") as string;

  await prisma.organization.update({
    where: { id: orgId },
    data: { name: orgName },
  });

  revalidatePath("/settings");
}

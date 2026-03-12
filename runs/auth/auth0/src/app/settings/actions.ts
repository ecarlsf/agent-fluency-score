"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth";

export async function updateUser(formData: FormData) {
  const user = await getRequiredUser();
  const name = formData.get("name") as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  revalidatePath("/settings");
}

export async function updateOrganization(formData: FormData) {
  const user = await getRequiredUser();
  const orgName = formData.get("orgName") as string;

  if (user.organizationId) {
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: orgName },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
